import { NextRequest, NextResponse } from 'next/server'
import { getSportScores, ScoreEntry } from '@/lib/odds-api'

export const revalidate = 30 // scores change quickly — cache 30 seconds

/**
 * GET /api/sports/scores
 *
 * Issue #9: Wire up live scores endpoint.
 * Returns current scores for a sport, joined by event ID so the UI can
 * overlay live scores on the match cards.
 *
 * Query params:
 *   sport_key  (required) — e.g. "soccer_epl", "americanfootball_nfl"
 *   days_from  (optional, default 1) — how many days back to include
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const sportKey = searchParams.get('sport_key')
  const daysFrom = parseInt(searchParams.get('days_from') || '1', 10)

  if (!sportKey) {
    return NextResponse.json(
      { error: 'sport_key query param is required' },
      { status: 400 }
    )
  }

  if (!process.env.ODDS_API_KEY) {
    return NextResponse.json(
      { error: 'Odds API not configured', message: 'Please set ODDS_API_KEY in .env' },
      { status: 500 }
    )
  }

  try {
    const rawScores = await getSportScores(sportKey, { daysFrom: Math.min(Math.max(daysFrom, 0), 3) })
    const scores = rawScores as unknown as ScoreEntry[]

    // Shape into a map keyed by event ID for easy client-side lookup
    const scoreMap: Record<string, { home: string | null; away: string | null; completed: boolean; lastUpdate: string | null }> = {}

    for (const entry of scores) {
      const homeScore = entry.scores?.find(s => s.name === entry.home_team)?.score ?? null
      const awayScore = entry.scores?.find(s => s.name === entry.away_team)?.score ?? null
      scoreMap[entry.id] = {
        home: homeScore,
        away: awayScore,
        completed: entry.completed,
        lastUpdate: entry.last_update,
      }
    }

    return NextResponse.json(
      {
        sportKey,
        scoreMap,
        count: scores.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error: any) {
    const msg = error?.message ?? 'Unknown error'

    const isQuota =
      msg.includes('quota') || msg.includes('429') || msg.includes('Too Many Requests')

    if (isQuota) {
      return NextResponse.json(
        { error: 'quota_exhausted', message: 'Odds API quota exhausted for scores' },
        { status: 429 }
      )
    }

    console.error('Scores API error:', msg)
    return NextResponse.json({ error: 'Failed to fetch scores', message: msg }, { status: 500 })
  }
}
