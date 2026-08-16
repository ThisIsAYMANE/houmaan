import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { checkBetAndGetEligibility, awardBetAndGet } from '@/lib/bet-and-get'
import { createNotification } from '@/lib/notifications'

/**
 * POST /api/admin/bets/[id]/settle
 * Manually settles a pending bet. Body: { outcome: 'won' | 'lost' | 'void' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { outcome } = await request.json()
    if (!['won', 'lost', 'void'].includes(outcome)) {
      return NextResponse.json(
        { error: 'outcome must be one of: won, lost, void' },
        { status: 400 }
      )
    }

    // Fetch the bet (support both bets and user_bets table names)
    let bet: any = await queryOne(
      `SELECT * FROM bets WHERE id = ? AND status = 'pending'`,
      [params.id]
    )
    if (!bet) {
      bet = await queryOne(
        `SELECT * FROM user_bets WHERE id = ? AND status = 'pending'`,
        [params.id]
      )
    }
    if (!bet) {
      return NextResponse.json(
        { error: 'Pari introuvable ou déjà réglé.' },
        { status: 404 }
      )
    }

    const tableName = bet.placed_at !== undefined ? 'user_bets' : 'bets'
    const now = new Date().toISOString()

    if (outcome === 'void') {
      // Void: refund stake to real balance
      await query(
        `UPDATE ${tableName} SET status = 'void', settled_at = ? WHERE id = ?`,
        [now, params.id]
      )
      await query(
        `UPDATE wallets SET balance = balance + ?, locked_balance = MAX(0, locked_balance - ?) WHERE user_id = ?`,
        [bet.amount, bet.amount, bet.user_id]
      )
    } else if (outcome === 'won') {
      const payout = bet.potential_win ?? (bet.amount * (bet.odds ?? 2))
      await query(
        `UPDATE ${tableName} SET status = 'won', settled_at = ?, actual_payout = ? WHERE id = ?`,
        [now, payout, params.id]
      )
      await query(
        `UPDATE wallets SET balance = balance + ?, locked_balance = MAX(0, locked_balance - ?) WHERE user_id = ?`,
        [payout, bet.amount, bet.user_id]
      )
    } else {
      // Lost: just release the locked stake (it was already deducted at placement)
      await query(
        `UPDATE ${tableName} SET status = 'lost', settled_at = ? WHERE id = ?`,
        [now, params.id]
      )
      await query(
        `UPDATE wallets SET locked_balance = MAX(0, locked_balance - ?) WHERE user_id = ?`,
        [bet.amount, bet.user_id]
      )
    }

    return NextResponse.json({
      success: true,
      betId: params.id,
      outcome,
      message: `Pari réglé comme "${outcome}".`,
    })

    // Phase 3: Non-blocking Bet & Get trigger for admin-settled lost bets
    if (outcome === 'lost') {
      ;(async () => {
        try {
          const eligibility = await checkBetAndGetEligibility(bet.user_id, params.id)
          if (eligibility.eligible) {
            await awardBetAndGet(bet.user_id)
            await createNotification({
              userId: bet.user_id,
              type: 'bonus_received',
              title: 'Pari & Gain activé !',
              message: 'Votre pari qualifiant a perdu — un bonus de 10 $ vous a été crédité.',
            }).catch(() => {})
          }
        } catch (e) {
          console.error('[BetAndGet-Admin] trigger error:', e)
        }
      })()
    }
  } catch (error: any) {
    console.error('Manual settle error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
