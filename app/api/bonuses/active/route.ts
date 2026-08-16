import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getAllActiveBonuses, runBonusMigrations } from '@/lib/bonus-db'

try { runBonusMigrations() } catch {}

/**
 * GET /api/bonuses/active
 * Returns all active bonuses for the authenticated user with progress details.
 */
export async function GET(request: NextRequest) {
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

    const bonuses = await getAllActiveBonuses(session.user_id)

    const formatted = bonuses.map((b: any) => ({
      id: b.id,
      type: b.bonus_type,
      status: b.status,
      bonusAmount: b.bonus_amount,
      wageringRequirement: b.wagering_requirement,
      wageringProgress: b.wagering_progress,
      progressPct: b.wagering_requirement > 0
        ? Math.min(100, Math.round((b.wagering_progress / b.wagering_requirement) * 100))
        : 100,
      maxBetLimit: b.max_bet_limit,
      expiresAt: b.expires_at,
      createdAt: b.created_at,
    }))

    return NextResponse.json({ bonuses: formatted, total: formatted.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
