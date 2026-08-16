import { NextRequest, NextResponse } from 'next/server'
import { getEventOdds, getSportOdds, getSports } from '@/lib/odds-api'
import { transformOddsApiEventToMatch } from '@/lib/odds-api-transform'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 30 // Revalidate every 30 seconds

/**
 * GET /api/sports/matches/:id
 *
 * Fetch a specific match from The Odds API.
 * Strategy:
 *   1. If sportKey is provided as a query param, fetch directly.
 *   2. Otherwise, get the full list of active sports and search across ALL of them.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id
    const searchParams = request.nextUrl.searchParams
    const sportKey = searchParams.get('sportKey')

    // Check if Odds API is configured
    if (!process.env.ODDS_API_KEY) {
      return NextResponse.json(
        {
          error: 'Odds API not configured',
          message: 'Please set ODDS_API_KEY in your .env file',
        },
        { status: 500 }
      )
    }

    // ── Strategy 1: sportKey provided — direct lookup ──────────────────────────
    if (sportKey) {
      try {
        const event = await getEventOdds(sportKey, matchId, {
          regions: 'eu,uk,us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'decimal',
        })
        const match = transformOddsApiEventToMatch(event)
        return NextResponse.json({ match })
      } catch (error) {
        console.warn(`Direct lookup failed for sport ${sportKey}, falling through to full search:`, error)
        // Fall through to full search below
      }
    }

    // ── Strategy 2: Search ALL active sports ──────────────────────────────────
    const availableSports = await getCachedData(
      'odds-api-sports-list',
      async () => getSports(),
      3600000 // 1 hour cache
    )

    // Get all active non-outright sports
    const allActiveSports = availableSports
      .filter((s: any) => s.active && !s.has_outrights)
      .map((s: any) => s.key)

    // Fetch all sports in parallel, looking for the match ID
    // Limit concurrency to avoid hammering the API
    const BATCH_SIZE = 10
    for (let i = 0; i < allActiveSports.length; i += BATCH_SIZE) {
      const batch = allActiveSports.slice(i, i + BATCH_SIZE)

      const results = await Promise.all(
        batch.map(async (sport: string) => {
          try {
            const events = await getCachedData(
              `odds-api-${sport}-events`,
              async () =>
                getSportOdds(sport, {
                  regions: 'eu,uk,us',
                  markets: 'h2h',
                  oddsFormat: 'decimal',
                }),
              60000 // 1 minute cache
            )
            const event = events.find((e: any) => e.id === matchId)
            return event ? { sport, event } : null
          } catch {
            return null
          }
        })
      )

      const found = results.find((r) => r !== null)
      if (found) {
        // If we found the event in a cached list, try to get full odds
        try {
          const fullEvent = await getEventOdds(found.sport, matchId, {
            regions: 'eu,uk,us',
            markets: 'h2h,spreads,totals',
            oddsFormat: 'decimal',
          })
          const match = transformOddsApiEventToMatch(fullEvent)
          return NextResponse.json({ match })
        } catch {
          // Fallback to cached partial data
          const match = transformOddsApiEventToMatch(found.event)
          return NextResponse.json({ match })
        }
      }
    }

    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching match from Odds API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch match', message: errorMessage },
      { status: 500 }
    )
  }
}
