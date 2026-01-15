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

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '7d'
    
    const days = range === '24h' ? 1 : range === '7d' ? 7 : 30

    // Total stats
    const totalStats = await queryOne<{
      sessions: number
      wagered: number
      won: number
      avg_duration: number
    }>(
      `SELECT 
        COUNT(*) as sessions,
        COALESCE(SUM(total_bet), 0) as wagered,
        COALESCE(SUM(total_win), 0) as won,
        COALESCE(AVG(session_duration), 0) as avg_duration
      FROM game_sessions
      WHERE started_at >= datetime('now', '-${days} days')`
    )

    // Top games
    const topGames = await query(
      `SELECT 
        g.id,
        g.title,
        gp.name as provider_name,
        COUNT(DISTINCT gs.id) as sessions,
        COUNT(DISTINCT gs.user_id) as unique_players,
        COALESCE(SUM(gs.total_bet), 0) as total_wagered,
        COALESCE(SUM(gs.total_win), 0) as total_won,
        COALESCE(SUM(gs.total_bet - gs.total_win), 0) as revenue,
        CASE 
          WHEN SUM(gs.total_bet) > 0 
          THEN (SUM(gs.total_win) / SUM(gs.total_bet) * 100)
          ELSE 0 
        END as rtp
      FROM game_sessions gs
      INNER JOIN games g ON gs.game_id = g.id
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      WHERE gs.started_at >= datetime('now', '-${days} days')
      GROUP BY g.id, g.title, gp.name
      ORDER BY revenue DESC
      LIMIT 20`
    )

    // Revenue by provider
    const revenueByProvider = await query(
      `SELECT 
        gp.name,
        COALESCE(SUM(gs.total_bet - gs.total_win), 0) as revenue
      FROM game_sessions gs
      INNER JOIN games g ON gs.game_id = g.id
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      WHERE gs.started_at >= datetime('now', '-${days} days')
      GROUP BY gp.name
      ORDER BY revenue DESC
      LIMIT 10`
    )

    return NextResponse.json({
      success: true,
      data: {
        totalSessions: totalStats?.sessions || 0,
        totalWagered: totalStats?.wagered || 0,
        totalWon: totalStats?.won || 0,
        netRevenue: (totalStats?.wagered || 0) - (totalStats?.won || 0),
        avgSessionDuration: Math.round(totalStats?.avg_duration || 0),
        topGames: topGames.rows || [],
        revenueByProvider: revenueByProvider.rows || []
      }
    })
  } catch (error) {
    console.error('Error fetching casino analytics:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 })
  }
}





