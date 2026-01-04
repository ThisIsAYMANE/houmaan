import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// Get session from cookie
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
 * GET /api/games/history
 * 
 * Get user's game play history with statistics
 * Includes: sessions played, total wagered, total won, favorite games
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get game sessions history
    const sessionsQuery = `
      SELECT 
        gs.id,
        gs.game_id,
        gs.started_at,
        gs.ended_at,
        gs.total_bet,
        gs.total_win,
        gs.session_duration,
        g.title as game_title,
        g.slug as game_slug,
        g.thumbnail_url,
        gp.name as provider_name,
        gc.name as category_name
      FROM game_sessions gs
      INNER JOIN games g ON gs.game_id = g.id
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE gs.user_id = ?
      ORDER BY gs.started_at DESC
      LIMIT ? OFFSET ?
    `

    const sessions = await query(sessionsQuery, [userId, limit, offset])

    // Get total count for pagination
    const countResult = await queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM game_sessions WHERE user_id = ?',
      [userId]
    )

    // Get summary statistics
    const statsResult = await queryOne<{
      total_sessions: number
      total_bet: number
      total_win: number
      net_result: number
    }>(
      `SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(total_bet), 0) as total_bet,
        COALESCE(SUM(total_win), 0) as total_win,
        COALESCE(SUM(total_win - total_bet), 0) as net_result
      FROM game_sessions 
      WHERE user_id = ?`,
      [userId]
    )

    // Get favorite games (most played)
    const favoriteGamesQuery = `
      SELECT 
        g.id,
        g.title,
        g.thumbnail_url,
        COUNT(gs.id) as play_count,
        SUM(gs.total_bet) as total_wagered
      FROM game_sessions gs
      INNER JOIN games g ON gs.game_id = g.id
      WHERE gs.user_id = ?
      GROUP BY g.id, g.title, g.thumbnail_url
      ORDER BY play_count DESC
      LIMIT 5
    `

    const favoriteGames = await query(favoriteGamesQuery, [userId])

    return NextResponse.json({
      sessions: sessions.rows || [],
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: (countResult?.total || 0) > offset + limit
      },
      statistics: {
        totalSessions: statsResult?.total_sessions || 0,
        totalBet: statsResult?.total_bet || 0,
        totalWin: statsResult?.total_win || 0,
        netResult: statsResult?.net_result || 0,
        winRate: statsResult?.total_bet ? 
          ((statsResult?.total_win || 0) / statsResult.total_bet * 100).toFixed(2) : '0'
      },
      favoriteGames: favoriteGames.rows || []
    })
  } catch (error) {
    console.error('Error fetching game history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game history' },
      { status: 500 }
    )
  }
}


