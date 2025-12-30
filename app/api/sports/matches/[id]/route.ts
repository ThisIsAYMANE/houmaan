import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id

    const sql = `
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
      WHERE m.id = ?
    `

    const match = await queryOne(sql, [matchId])

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}





