import { NextRequest, NextResponse } from 'next/server'
import { getSportOdds } from '@/lib/odds-api'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 60 // Revalidate every minute (odds change frequently)

/**
 * GET /api/odds/sports/:sportKey
 * 
 * Get odds for a specific sport
 * 
 * Query parameters:
 * - regions: Comma-separated list of regions (e.g., 'us', 'eu', 'uk')
 * - markets: Comma-separated list of markets (e.g., 'h2h', 'spreads', 'totals')
 * - oddsFormat: 'american' or 'decimal' (default: 'american')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sportKey: string } }
) {
  try {
    const { sportKey } = params
    const searchParams = request.nextUrl.searchParams
    
    const regions = searchParams.get('regions') || 'us'
    const markets = searchParams.get('markets') || 'h2h,spreads,totals'
    const oddsFormat = (searchParams.get('oddsFormat') || 'american') as 'american' | 'decimal'

    // Create cache key based on parameters
    const cacheKey = `odds-api-${sportKey}-${regions}-${markets}-${oddsFormat}`

    // Use cache with shorter TTL for odds (they change frequently)
    const events = await getCachedData(
      cacheKey,
      async () => {
        return await getSportOdds(sportKey, {
          regions,
          markets,
          oddsFormat,
        })
      },
      60000 // Cache for 1 minute (odds change frequently)
    )

    return NextResponse.json({
      sportKey,
      events,
      total: events.length,
      regions,
      markets,
      oddsFormat,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error(`Error fetching odds for sport ${params.sportKey}:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch odds',
        message: errorMessage,
        sportKey: params.sportKey,
      },
      { status: 500 }
    )
  }
}



