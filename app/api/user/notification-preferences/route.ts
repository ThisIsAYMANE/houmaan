import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

async function getUserId(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null
  
  try {
    const session = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP',
      [sessionCookie.value]
    )
    return session?.user_id || null
  } catch {
    return null
  }
}

/**
 * GET /api/user/notification-preferences
 * 
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let preferences = await queryOne(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    )

    // If no preferences exist, create default ones
    if (!preferences) {
      await query(
        `INSERT INTO notification_preferences (
          user_id, bet_placed, bet_won, bet_lost, bet_cashout,
          deposit_confirmed, deposit_pending, withdrawal_processed, withdrawal_pending,
          bonus_received, tier_upgraded, admin_alert, system_message
        ) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)`,
        [userId]
      )

      preferences = await queryOne(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [userId]
      )
    }

    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

/**
 * POST /api/user/notification-preferences
 * 
 * Update user's notification preferences
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()

    // Update preferences
    await query(
      `UPDATE notification_preferences SET
        bet_placed = ?,
        bet_won = ?,
        bet_lost = ?,
        bet_cashout = ?,
        deposit_confirmed = ?,
        deposit_pending = ?,
        withdrawal_processed = ?,
        withdrawal_pending = ?,
        bonus_received = ?,
        tier_upgraded = ?,
        admin_alert = ?,
        system_message = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        body.bet_placed ? 1 : 0,
        body.bet_won ? 1 : 0,
        body.bet_lost ? 1 : 0,
        body.bet_cashout ? 1 : 0,
        body.deposit_confirmed ? 1 : 0,
        body.deposit_pending ? 1 : 0,
        body.withdrawal_processed ? 1 : 0,
        body.withdrawal_pending ? 1 : 0,
        body.bonus_received ? 1 : 0,
        body.tier_upgraded ? 1 : 0,
        body.admin_alert ? 1 : 0,
        body.system_message ? 1 : 0,
        userId
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}



