import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  try {
    const session = await queryOne<{ admin_id: string }>(
      'SELECT admin_id FROM admin_sessions WHERE session_token = ? AND expires_at > datetime("now")',
      [token]
    )
    return session?.admin_id || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId, result } = body // result: 'home', 'away', 'draw', 'void'

    // Get all bets for this match
    const bets = await query(
      `SELECT DISTINCT ub.*
      FROM user_bets ub
      INNER JOIN bet_selections bs ON ub.id = bs.bet_id
      WHERE bs.match_id = ? AND ub.status = 'pending'`,
      [matchId]
    )

    let processed = 0
    let totalPaid = 0

    for (const bet of bets.rows || []) {
      let betResult = 'lost'
      let payoutAmount = 0

      if (result === 'void') {
        // Return stake
        betResult = 'void'
        payoutAmount = bet.amount
      } else {
        // Check if bet won (simplified - would need full logic for real implementation)
        // For single bets on 1X2 market
        const selection = await queryOne<{ selection: string }>(
          'SELECT selection FROM bet_selections WHERE bet_id = ? AND match_id = ? LIMIT 1',
          [bet.id, matchId]
        )

        if (selection) {
          const won = 
            (result === 'home' && selection.selection === '1') ||
            (result === 'away' && selection.selection === '2') ||
            (result === 'draw' && selection.selection === 'X')

          if (won) {
            betResult = 'won'
            payoutAmount = bet.potential_win
          }
        }
      }

      // Update bet status
      await query(
        'UPDATE user_bets SET status = ?, payout_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [betResult, payoutAmount, bet.id]
      )

      // Credit wallet if won or void
      if (payoutAmount > 0) {
        await query(
          'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
          [payoutAmount, bet.user_id]
        )

        // Record transaction
        await query(
          `INSERT INTO wallet_transactions (id, user_id, type, amount, description, created_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [nanoid(), bet.user_id, betResult === 'won' ? 'win' : 'refund', payoutAmount, `Bet ${betResult}: ${bet.id}`]
        )

        totalPaid += payoutAmount
      }

      processed++
    }

    // Update match status
    await query(
      'UPDATE matches SET status = "finished", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [matchId]
    )

    return NextResponse.json({
      success: true,
      processed,
      totalPaid
    })
  } catch (error) {
    console.error('Error processing payouts:', error)
    return NextResponse.json({ success: false, error: 'Failed to process payouts' }, { status: 500 })
  }
}

