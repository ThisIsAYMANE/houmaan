import { NextRequest, NextResponse } from 'next/server'
import { getEventOdds } from '@/lib/odds-api'
import { americanToDecimal } from '@/lib/odds-api'

// Next.js route segment config for caching
export const revalidate = 30 // Revalidate every 30 seconds

/**
 * GET /api/sports/matches/:id/odds
 * 
 * Get odds for a specific match from The Odds API
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

    if (!sportKey) {
      return NextResponse.json(
        { error: 'sportKey query parameter is required' },
        { status: 400 }
      )
    }

    // Fetch event odds from Odds API
    const event = await getEventOdds(sportKey, matchId, {
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
    })

    // Transform Odds API format to our market format
    const marketsMap = new Map<string, any>()

    for (const bookmaker of event.bookmakers) {
      for (const market of bookmaker.markets) {
        const marketKey = market.key // 'h2h', 'spreads', 'totals'
        
        if (!marketsMap.has(marketKey)) {
          // Map market keys to display names
          const marketNames: Record<string, string> = {
            'h2h': 'Match Result',
            'spreads': 'Spreads',
            'totals': 'Totals',
          }

          marketsMap.set(marketKey, {
            id: marketKey,
            name: marketNames[marketKey] || marketKey.toUpperCase(),
            slug: marketKey,
            type: marketKey,
            odds: [],
          })
        }

        // Add outcomes to market
        for (const outcome of market.outcomes) {
          const existingOdds = marketsMap.get(marketKey)!.odds.find(
            (o: any) => o.selection === outcome.name
          )

          if (!existingOdds) {
            // Convert American odds to decimal
            const decimalOdds = americanToDecimal(outcome.price)
            
            marketsMap.get(marketKey)!.odds.push({
              id: `${marketKey}-${outcome.name}`,
              selection: outcome.name,
              odds: decimalOdds,
              point: outcome.point,
              description: outcome.description,
              bookmaker: bookmaker.title,
            })
          }
        }
      }
    }

    const markets = Array.from(marketsMap.values())

    return NextResponse.json({
      matchId,
      markets,
      event: {
        id: event.id,
        home_team: event.home_team,
        away_team: event.away_team,
        commence_time: event.commence_time,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Error fetching odds from Odds API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch odds',
        message: errorMessage,
        matchId: params.id,
      },
      { status: 500 }
    )
  }
}

