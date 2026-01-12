import { NextRequest, NextResponse } from 'next/server'
import { getEventOdds, getSportOdds } from '@/lib/odds-api'
import { transformOddsApiEventToMatch } from '@/lib/odds-api-transform'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 30 // Revalidate every 30 seconds

/**
 * GET /api/sports/matches/:id
 * 
 * Fetch a specific match from The Odds API
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
          message: 'Please set ODDS_API_KEY in your .env file'
        },
        { status: 500 }
      )
    }

    // If sportKey is provided, use it directly
    if (sportKey) {
      try {
        const event = await getEventOdds(sportKey, matchId, {
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
        })

        const match = transformOddsApiEventToMatch(event)
        return NextResponse.json({ match })
      } catch (error) {
        console.error(`Error fetching event ${matchId} for sport ${sportKey}:`, error)
      }
    }

    // If sportKey not provided, try to find the event by searching popular sports
    const popularSports = ['americanfootball_nfl', 'basketball_nba', 'soccer_epl', 'icehockey_nhl']
    
    for (const sport of popularSports) {
      try {
        const events = await getCachedData(
          `odds-api-${sport}-events`,
          async () => {
            return await getSportOdds(sport, {
              regions: 'us',
              markets: 'h2h',
              oddsFormat: 'american',
            })
          },
          60000 // Cache for 1 minute
        )

        const event = events.find(e => e.id === matchId)
        if (event) {
          const match = transformOddsApiEventToMatch(event)
          return NextResponse.json({ match })
        }
      } catch (error) {
        // Continue to next sport
        continue
      }
    }

    return NextResponse.json(
      { error: 'Match not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching match from Odds API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch match',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

