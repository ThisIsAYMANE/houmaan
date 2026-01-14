import { NextRequest, NextResponse } from 'next/server'
import { getGames } from '@/lib/casino-api'

/**
 * GET /api/casino/games
 * 
 * Fetch games list from Slotegrator Casino API
 * 
 * Query parameters:
 * - expand: Additional object expansions (tags, parameters, images, related_games)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const expand = searchParams.get('expand')

    const gamesResponse = await getGames({
      expand: expand || undefined,
    })

    return NextResponse.json({
      success: true,
      games: gamesResponse.items || [],
      meta: gamesResponse._meta,
      total: gamesResponse._meta?.totalCount || gamesResponse.items?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching games from Casino API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Failed to fetch games from Casino API. Please check your configuration and try again.',
      },
      { status: 500 }
    )
  }
}


