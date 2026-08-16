import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

/**
 * GET /api/bonuses/free-spins/available
 * Returns today's available free spin batch for the authenticated user.
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
    const userId = session.user_id

    const today = new Date().toISOString().split('T')[0]

    // Find today's batch from any active welcome bonus
    const batch = await queryOne<{
      id: string
      user_bonus_id: string
      game_id: string
      total_spins: number
      spins_used: number
      release_date: string
      expires_at: string
    }>(
      `SELECT fsb.*
       FROM free_spin_batches fsb
       JOIN user_bonuses ub ON fsb.user_bonus_id = ub.id
       WHERE ub.user_id = ?
         AND ub.status = 'active'
         AND fsb.release_date = ?
         AND fsb.expires_at > datetime('now')
         AND fsb.spins_used < fsb.total_spins
       LIMIT 1`,
      [userId, today]
    )

    if (!batch) {
      // Check if there are future batches
      const nextBatch = await queryOne<{ release_date: string }>(
        `SELECT fsb.release_date
         FROM free_spin_batches fsb
         JOIN user_bonuses ub ON fsb.user_bonus_id = ub.id
         WHERE ub.user_id = ? AND ub.status = 'active' AND fsb.release_date > ?
         ORDER BY fsb.release_date ASC LIMIT 1`,
        [userId, today]
      )

      return NextResponse.json({
        available: false,
        spinsRemaining: 0,
        nextBatchDate: nextBatch?.release_date ?? null,
        message: nextBatch
          ? `Prochains tours gratuits disponibles le ${nextBatch.release_date}`
          : 'Aucun tour gratuit disponible',
      })
    }

    return NextResponse.json({
      available: true,
      batchId: batch.id,
      gameId: batch.game_id,
      spinsRemaining: batch.total_spins - batch.spins_used,
      totalSpins: batch.total_spins,
      spinsUsed: batch.spins_used,
      expiresAt: batch.expires_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/bonuses/free-spins/available
 * Record a used free spin (called by casino integration after each spin).
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

    const { batchId } = await request.json()
    if (!batchId) return NextResponse.json({ error: 'batchId requis' }, { status: 400 })

    await query(
      `UPDATE free_spin_batches SET spins_used = spins_used + 1 WHERE id = ?`,
      [batchId]
    )

    const updated = await queryOne<{ spins_used: number; total_spins: number }>(
      `SELECT spins_used, total_spins FROM free_spin_batches WHERE id = ?`,
      [batchId]
    )

    return NextResponse.json({
      success: true,
      spinsRemaining: (updated?.total_spins ?? 0) - (updated?.spins_used ?? 0),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
