import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'

/**
 * GET /api/admin/users/[id]/activity
 * Returns paginated activity for a single user: bets, deposits, withdrawals.
 * Query params: ?tab=bets&page=1&limit=20
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = request.nextUrl
  const tab = searchParams.get('tab') ?? 'bets'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
  const offset = (page - 1) * limit
  const userId = params.id

  try {
    if (tab === 'bets') {
      const bets = await query(
        `SELECT id, amount, odds, status, selection, bet_type,
                potential_win, actual_payout, placed_at, settled_at, funded_by
         FROM bets
         WHERE user_id = ?
         ORDER BY placed_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      ).catch(() => query(
        `SELECT id, amount, odds, status, selection,
                potential_win, placed_at
         FROM user_bets
         WHERE user_id = ?
         ORDER BY placed_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      ))

      const total = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM bets WHERE user_id = ?`, [userId]
      ).catch(() => queryOne<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM user_bets WHERE user_id = ?`, [userId]
      ))

      return NextResponse.json({
        tab: 'bets',
        data: bets?.rows ?? [],
        total: total?.cnt ?? 0,
        page,
        limit,
      })
    }

    if (tab === 'deposits') {
      const deposits = await query(
        `SELECT id, amount, btc_amount, currency, status, tx_hash, network, created_at
         FROM deposits
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      )
      const total = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM deposits WHERE user_id = ?`, [userId]
      )
      return NextResponse.json({
        tab: 'deposits',
        data: deposits.rows,
        total: total?.cnt ?? 0,
        page, limit,
      })
    }

    if (tab === 'withdrawals') {
      const withdrawals = await query(
        `SELECT id, amount, currency, status, destination_address, created_at, processed_at
         FROM withdrawals
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      )
      const total = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM withdrawals WHERE user_id = ?`, [userId]
      )
      return NextResponse.json({
        tab: 'withdrawals',
        data: withdrawals.rows,
        total: total?.cnt ?? 0,
        page, limit,
      })
    }

    if (tab === 'bonuses') {
      const bonuses = await query(
        `SELECT id, bonus_type, status, bonus_amount, wagering_requirement,
                wagering_progress, expires_at, created_at, completed_at
         FROM user_bonuses
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      ).catch(() => ({ rows: [] }))

      return NextResponse.json({
        tab: 'bonuses',
        data: bonuses.rows,
        total: bonuses.rows.length,
        page, limit,
      })
    }

    return NextResponse.json({ error: `Unknown tab: ${tab}` }, { status: 400 })
  } catch (error: any) {
    console.error('User activity error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
