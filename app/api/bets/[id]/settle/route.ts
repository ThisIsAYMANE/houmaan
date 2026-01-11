import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// Admin authentication check (simplified)
async function isAdmin(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('admin_session')
  if (!sessionCookie) return false
  
  try {
    const session = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM admin_sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP',
      [sessionCookie.value]
    )
    return !!session
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id: betId } = params
    const body = await request.json()
    const { result, reason } = body // result: 'won' | 'lost' | 'void' | 'cancelled'

    if (!result || !['won', 'lost', 'void', 'cancelled'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be: won, lost, void, or cancelled' },
        { status: 400 }
      )
    }

    // Get bet details
    const bet = await queryOne<{
      id: string
      user_id: string
      amount: number
      potential_win: number
      status: string
      currency: string
    }>(
      'SELECT id, user_id, amount, potential_win, status, currency FROM user_bets WHERE id = ?',
      [betId]
    )

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      )
    }

    if (bet.status !== 'pending') {
      return NextResponse.json(
        { error: `Bet already settled with status: ${bet.status}` },
        { status: 400 }
      )
    }

    let payoutAmount = 0
    let finalStatus = result

    // Calculate payout
    if (result === 'won') {
      payoutAmount = bet.potential_win
      finalStatus = 'won'
    } else if (result === 'void' || result === 'cancelled') {
      payoutAmount = bet.amount // Refund original bet
      finalStatus = result
    } else if (result === 'lost') {
      payoutAmount = 0
      finalStatus = 'lost'
    }

    // Update bet status
    await query(
      `UPDATE user_bets 
       SET status = ?, result = ?, payout = ?, settled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [finalStatus, reason || result, payoutAmount, betId]
    )

    // Credit payout to user wallet if any
    if (payoutAmount > 0) {
      await query(
        `UPDATE wallets 
         SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND currency = ?`,
        [payoutAmount, bet.user_id, bet.currency]
      )
    }

    // Get updated balance
    const wallet = await queryOne<{ balance: number }>(
      'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
      [bet.user_id, bet.currency]
    )

    return NextResponse.json({
      message: 'Bet settled successfully',
      betId,
      result: finalStatus,
      payoutAmount,
      newBalance: wallet?.balance || 0
    })
  } catch (error) {
    console.error('Error settling bet:', error)
    return NextResponse.json(
      { error: 'Failed to settle bet' },
      { status: 500 }
    )
  }
}

// Auto-settle endpoint (can be called by cron job or webhook)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: matchId } = params
    const body = await request.json()
    const { homeScore, awayScore, status } = body

    if (status !== 'finished') {
      return NextResponse.json(
        { error: 'Match must be finished to auto-settle' },
        { status: 400 }
      )
    }

    // Get all pending bets for this match
    const bets = await query(
      `SELECT id, selection, market_type FROM user_bets 
       WHERE match_id = ? AND status = 'pending'`,
      [matchId]
    )

    let settledCount = 0
    
    for (const bet of bets.rows as Array<{ id: string; selection: string; market_type: string }>) {
      let result = 'lost'
      
      // Determine result based on market type and selection
      if (bet.market_type === '1x2') {
        const winner = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X'
        result = bet.selection === winner ? 'won' : 'lost'
      }
      // Add more market types logic here (over/under, handicap, etc.)
      
      // Settle the bet using the POST endpoint logic
      await query(
        `UPDATE user_bets 
         SET status = ?, result = ?, 
             payout = CASE WHEN ? = 'won' THEN potential_win ELSE 0 END,
             settled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [result, `Auto-settled: ${homeScore}-${awayScore}`, result, bet.id]
      )
      
      // Credit payout if won
      if (result === 'won') {
        const betDetails = await queryOne<{ user_id: string; potential_win: number; currency: string }>(
          'SELECT user_id, potential_win, currency FROM user_bets WHERE id = ?',
          [bet.id]
        )
        
        if (betDetails) {
          await query(
            `UPDATE wallets 
             SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ? AND currency = ?`,
            [betDetails.potential_win, betDetails.user_id, betDetails.currency]
          )
        }
      }
      
      settledCount++
    }

    return NextResponse.json({
      message: 'Bets auto-settled successfully',
      settledCount,
      matchId
    })
  } catch (error) {
    console.error('Error auto-settling bets:', error)
    return NextResponse.json(
      { error: 'Failed to auto-settle bets' },
      { status: 500 }
    )
  }
}




