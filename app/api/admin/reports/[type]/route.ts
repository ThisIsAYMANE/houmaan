import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'

/**
 * GET /api/admin/reports/[type]
 * Supported types: betting, casino, transactions, users, bonuses, fraud
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const type = params.type

  try {
    let data: any[] = []

    if (type === 'betting') {
      const sql = from && to
        ? `SELECT b.*, u.email FROM bets b LEFT JOIN users u ON b.user_id = u.id WHERE b.placed_at BETWEEN ? AND ? ORDER BY b.placed_at DESC LIMIT 5000`
        : `SELECT b.*, u.email FROM bets b LEFT JOIN users u ON b.user_id = u.id ORDER BY b.placed_at DESC LIMIT 5000`
      const result = await query(sql, from && to ? [from, to] : [])
      data = result.rows
    }

    else if (type === 'casino') {
      const sql = from && to
        ? `SELECT * FROM game_sessions WHERE started_at BETWEEN ? AND ? ORDER BY started_at DESC LIMIT 5000`
        : `SELECT * FROM game_sessions ORDER BY started_at DESC LIMIT 5000`
      const result = await query(sql, from && to ? [from, to] : []).catch(() => ({ rows: [] }))
      data = result.rows
    }

    else if (type === 'transactions') {
      const depsql = from && to
        ? `SELECT 'deposit' as type, d.*, u.email FROM deposits d LEFT JOIN users u ON d.user_id = u.id WHERE d.created_at BETWEEN ? AND ? ORDER BY d.created_at DESC LIMIT 2500`
        : `SELECT 'deposit' as type, d.*, u.email FROM deposits d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT 2500`
      const withsql = from && to
        ? `SELECT 'withdrawal' as type, w.*, u.email FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id WHERE w.created_at BETWEEN ? AND ? ORDER BY w.created_at DESC LIMIT 2500`
        : `SELECT 'withdrawal' as type, w.*, u.email FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC LIMIT 2500`
      const args = from && to ? [from, to] : []
      const [deps, withs] = await Promise.all([query(depsql, args), query(withsql, args)])
      data = [...deps.rows, ...withs.rows]
    }

    else if (type === 'users') {
      const sql = from && to
        ? `SELECT u.*, w.balance, w.bonus_balance FROM users u LEFT JOIN wallets w ON u.id = w.user_id WHERE u.created_at BETWEEN ? AND ? ORDER BY u.created_at DESC`
        : `SELECT u.*, w.balance, w.bonus_balance FROM users u LEFT JOIN wallets w ON u.id = w.user_id ORDER BY u.created_at DESC`
      const result = await query(sql, from && to ? [from, to] : [])
      data = result.rows
    }

    else if (type === 'bonuses') {
      const sql = from && to
        ? `SELECT ub.*, u.email FROM user_bonuses ub LEFT JOIN users u ON ub.user_id = u.id WHERE ub.created_at BETWEEN ? AND ? ORDER BY ub.created_at DESC`
        : `SELECT ub.*, u.email FROM user_bonuses ub LEFT JOIN users u ON ub.user_id = u.id ORDER BY ub.created_at DESC`
      const result = await query(sql, from && to ? [from, to] : []).catch(() => ({ rows: [] }))
      data = result.rows
    }

    else if (type === 'fraud') {
      const links = await query(
        `SELECT sal.*, ua.email AS email_a, ub.email AS email_b
         FROM suspicious_account_links sal
         LEFT JOIN users ua ON sal.user_id_a = ua.id
         LEFT JOIN users ub ON sal.user_id_b = ub.id
         ORDER BY sal.detected_at DESC`,
        []
      ).catch(() => ({ rows: [] }))
      data = links.rows
    }

    else {
      return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      count: data.length,
      from: from ?? null,
      to: to ?? null,
      data,
    })
  } catch (error: any) {
    console.error(`Report error [${type}]:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
