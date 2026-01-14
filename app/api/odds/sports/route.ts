import { NextResponse } from 'next/server'
import { getSports } from '@/lib/odds-api'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 3600 // Revalidate every hour (sports list doesn't change often)

/**
 * GET /api/odds/sports
 * 
 * Get list of available sports from The Odds API
 */
export async function GET() {
  try {
    // Use cache to reduce API calls
    const sports = await getCachedData(
      'odds-api-sports',
      async () => {
        return await getSports()
      },
      3600000 // Cache for 1 hour
    )

    // Filter to only active sports
    const activeSports = sports.filter(sport => sport.active)

    return NextResponse.json({
      sports: activeSports,
      total: activeSports.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching sports from Odds API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sports',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}


