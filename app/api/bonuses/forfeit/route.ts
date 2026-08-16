import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

/**
 * POST /api/bonuses/forfeit
 * Allows a user to forfeit an active bonus.
 * Resets bonus_balance to 0 for that bonus.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)

    const session = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP`,
      [token]
    )
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    const userId = session.user_id

    const body = await request.json().catch(() => ({}))
    const { bonusId } = body

    // Find the bonus belonging to this user
    let bonus: any
    if (bonusId) {
      bonus = await queryOne(
        `SELECT * FROM user_bonuses WHERE id = ? AND user_id = ? AND status = 'active'`,
        [bonusId, userId]
      )
    } else {
      // Forfeit the most recent active bonus
      bonus = await queryOne(
        `SELECT * FROM user_bonuses WHERE user_id = ? AND status = 'active'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
    }

    if (!bonus) {
      return NextResponse.json({ error: 'Aucun bonus actif trouvé.' }, { status: 404 })
    }

    // Mark forfeited
    await query(
      `UPDATE user_bonuses SET status = 'forfeited', completed_at = ? WHERE id = ?`,
      [new Date().toISOString(), bonus.id]
    )

    // Zero out bonus_balance
    await query(
      `UPDATE wallets SET bonus_balance = 0 WHERE user_id = ?`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      message: 'Bonus abandonné. Votre solde bonus a été réinitialisé.',
      forfeitedAmount: bonus.bonus_amount,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
