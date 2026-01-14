import { NextRequest, NextResponse } from 'next/server'
import { getEventOdds } from '@/lib/odds-api'

// Next.js route segment config for caching
export const revalidate = 30 // Revalidate every 30 seconds (odds change very frequently)

/**
 * GET /api/odds/events/:eventId
 * 
 * Get odds for a specific event
 * 
 * Query parameters:
 * - sportKey: Sport key (required)
 * - regions: Comma-separated list of regions (e.g., 'us', 'eu', 'uk')
 * - markets: Comma-separated list of markets (e.g., 'h2h', 'spreads', 'totals')
 * - oddsFormat: 'american' or 'decimal' (default: 'american')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const searchParams = request.nextUrl.searchParams
    
    const sportKey = searchParams.get('sportKey')
    if (!sportKey) {
      return NextResponse.json(
        { error: 'sportKey query parameter is required' },
        { status: 400 }
      )
    }

    const regions = searchParams.get('regions') || 'us'
    const markets = searchParams.get('markets') || 'h2h,spreads,totals'
    const oddsFormat = (searchParams.get('oddsFormat') || 'american') as 'american' | 'decimal'

    const event = await getEventOdds(sportKey, eventId, {
      regions,
      markets,
      oddsFormat,
    })

    return NextResponse.json({
      event,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error(`Error fetching odds for event ${params.eventId}:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch event odds',
        message: errorMessage,
        eventId: params.eventId,
      },
      { status: 500 }
    )
  }
}


