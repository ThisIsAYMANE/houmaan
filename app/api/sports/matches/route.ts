import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sportId = searchParams.get('sport_id')
    const leagueId = searchParams.get('league_id')
    const status = searchParams.get('status') // 'live', 'upcoming', 'finished'
    const isLive = searchParams.get('is_live') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let sql = `
      SELECT 
        m.id,
        m.sport_id,
        m.league_id,
        m.home_team,
        m.away_team,
        m.home_team_logo,
        m.away_team_logo,
        m.status,
        m.match_time,
        m.current_score,
        m.home_score,
        m.away_score,
        m.first_half_score,
        m.second_half_score,
        m.match_minute,
        m.is_live,
        m.created_at,
        m.updated_at,
        s.name as sport_name,
        s.slug as sport_slug,
        l.name as league_name,
        l.slug as league_slug,
        l.country as league_country
      FROM matches m
      INNER JOIN sports s ON m.sport_id = s.id
      INNER JOIN leagues l ON m.league_id = l.id
      WHERE 1=1
    `

    const params: unknown[] = []

    if (sportId) {
      sql += ' AND m.sport_id = ?'
      params.push(sportId)
    }

    if (leagueId) {
      sql += ' AND m.league_id = ?'
      params.push(leagueId)
    }

    if (isLive) {
      sql += ' AND m.is_live = 1'
    }

    if (status) {
      sql += ' AND m.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY m.is_live DESC, m.match_time ASC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const result = await query(sql, params)

    return NextResponse.json({
      matches: result.rows,
      total: result.rowCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}


