import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

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

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get matches with pending bets
    const matches = await query(
      `SELECT 
        m.id as match_id,
        m.home_team,
        m.away_team,
        m.home_score,
        m.away_score,
        m.status,
        COUNT(DISTINCT ub.id) as bet_count,
        COALESCE(SUM(ub.amount), 0) as total_stake,
        COALESCE(SUM(ub.potential_win), 0) as total_payout
      FROM matches m
      INNER JOIN bet_selections bs ON m.id = bs.match_id
      INNER JOIN user_bets ub ON bs.bet_id = ub.id
      WHERE ub.status = 'pending'
        AND m.status IN ('finished', 'live', 'scheduled')
      GROUP BY m.id
      ORDER BY m.match_time DESC
      LIMIT 50`
    )

    const payouts = (matches.rows || []).map((m: any) => ({
      ...m,
      status: m.status === 'finished' ? 'pending' : 'waiting'
    }))

    return NextResponse.json({
      success: true,
      data: payouts
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 })
  }
}





