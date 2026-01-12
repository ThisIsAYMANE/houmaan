import { NextRequest, NextResponse } from 'next/server'
import { getSportOdds, getSports } from '@/lib/odds-api'
import { transformOddsApiEventsToMatches } from '@/lib/odds-api-transform'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 60 // Revalidate every minute (odds change frequently)

/**
 * Map sport slug/ID to Odds API sport key
 * IMPORTANT: Distinguishes between American Football and Football/Soccer
 */
function mapSportToOddsApiKey(sportId: string | null): string | null {
  if (!sportId) return null

  // If it's already an Odds API key format, return as is
  if (sportId.includes('_')) {
    return sportId
  }

  // Map common sport slugs to Odds API keys
  // NOTE: 'american-football' is different from 'football' (soccer)
  const sportMap: Record<string, string> = {
    'american-football': 'americanfootball_nfl', // American Football (NFL)
    'football': 'soccer_epl', // European Football/Soccer
    'soccer': 'soccer_epl', // Alias for football
    'basketball': 'basketball_nba',
    'ice-hockey': 'icehockey_nhl',
    'hockey': 'icehockey_nhl',
    'baseball': 'baseball_mlb',
    'tennis': 'tennis_atp_aus_open_singles',
    'mma': 'mma_mixed_martial_arts',
    'boxing': 'boxing_boxing',
    'rugby-league': 'rugbyleague_nrl',
    'rugby-union': 'rugbyunion_six_nations',
    'cricket': 'cricket_big_bash',
  }

  return sportMap[sportId] || null
}

/**
 * GET /api/sports/matches
 * 
 * Fetch matches from The Odds API instead of database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sportId = searchParams.get('sport_id')
    const status = searchParams.get('status') // 'live', 'upcoming', 'finished'
    const isLive = searchParams.get('is_live') === 'true'
    // Use a very high limit or no limit to get all matches
    // Set to 10000 to effectively get all matches (Odds API typically returns < 1000 per sport)
    const limit = parseInt(searchParams.get('limit') || '10000')

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

    // Get available sports to determine which sport to fetch
    const availableSports = await getCachedData(
      'odds-api-sports-list',
      async () => {
        return await getSports()
      },
      3600000 // Cache for 1 hour
    )

    // If sport_id is specified, map it to Odds API key
    let sportKey: string | null = null
    if (sportId) {
      // If it's already an Odds API key (contains underscore), use it directly
      if (sportId.includes('_')) {
        sportKey = sportId
      } else {
        // Try mapping from slug
        sportKey = mapSportToOddsApiKey(sportId)
        
        // If mapping failed, try to find by key directly in available sports
        if (!sportKey) {
          const sport = availableSports.find(s => s.key === sportId)
          if (sport) {
            sportKey = sport.key
          }
        }
      }
    }

    // If no sport specified, fetch from ALL active sports
    if (!sportKey) {
      // Get ALL active sports from available sports (exclude outrights)
      const allActiveSports = availableSports
        .filter(s => s.active && !s.has_outrights)
        .map(s => s.key)

      if (allActiveSports.length === 0) {
        return NextResponse.json({
          matches: [],
          total: 0,
          limit,
          offset: 0,
          message: 'No active sports available'
        })
      }

      // Fetch from ALL active sports in parallel (no limit - get all matches from all sports)
      const sportsToFetch = allActiveSports
      const eventsPromises = sportsToFetch.map(sport =>
        getSportOdds(sport, {
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
        }).catch(error => {
          console.warn(`Failed to fetch events for ${sport}:`, error)
          return [] // Return empty array on error
        })
      )

      const eventsArrays = await Promise.all(eventsPromises)
      const allEvents = eventsArrays.flat()

      // Transform to our match format
      let matches = transformOddsApiEventsToMatches(allEvents)

      // Apply filters
      if (isLive || status === 'live') {
        matches = matches.filter(m => m.is_live)
      } else if (status === 'upcoming') {
        matches = matches.filter(m => m.status === 'upcoming')
      } else if (status === 'finished') {
        matches = matches.filter(m => m.status === 'finished')
      }

      // Sort: live matches first, then by match time
      matches.sort((a, b) => {
        if (a.is_live && !b.is_live) return -1
        if (!a.is_live && b.is_live) return 1
        return new Date(a.match_time).getTime() - new Date(b.match_time).getTime()
      })

      // Apply limit
      const limitedMatches = matches.slice(0, limit)

      return NextResponse.json({
        matches: limitedMatches,
        total: matches.length,
        limit,
        offset: 0,
        sportsFetched: sportsToFetch,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      })
    }

    // Fetch odds from Odds API for specific sport
    const events = await getSportOdds(sportKey, {
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
    })

    // Transform to our match format
    let matches = transformOddsApiEventsToMatches(events)

    // Apply filters
    if (isLive || status === 'live') {
      matches = matches.filter(m => m.is_live)
    } else if (status === 'upcoming') {
      matches = matches.filter(m => m.status === 'upcoming')
    } else if (status === 'finished') {
      matches = matches.filter(m => m.status === 'finished')
    }

    // Apply limit
    const limitedMatches = matches.slice(0, limit)

    return NextResponse.json({
      matches: limitedMatches,
      total: matches.length,
      limit,
      offset: 0,
      sportKey,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error fetching matches from Odds API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch matches',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
