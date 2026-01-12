import { NextResponse } from 'next/server'
import { getSports } from '@/lib/odds-api'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 3600 // Revalidate every hour

/**
 * GET /api/sports/sports-list
 * 
 * Get list of sports from Odds API, grouped and formatted for the frontend
 */
export async function GET() {
  try {
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

    // Get available sports
    const sports = await getCachedData(
      'odds-api-sports-for-frontend',
      async () => {
        return await getSports()
      },
      3600000 // Cache for 1 hour
    )

    // Filter to only active sports, exclude outrights (championship winners)
    const activeSports = sports.filter(sport => sport.active && !sport.has_outrights)

    // Group sports by their group (e.g., "Soccer", "Basketball", etc.)
    const groupedSports = new Map<string, typeof activeSports>()
    
    activeSports.forEach(sport => {
      const group = sport.group || 'Other'
      if (!groupedSports.has(group)) {
        groupedSports.set(group, [])
      }
      groupedSports.get(group)!.push(sport)
    })

    // Create a simplified format for frontend
    // Group by main sport category to avoid duplicates
    const sportMap = new Map<string, {
      id: string
      name: string
      slug: string
      group: string
      key: string
      count: number
    }>()

    activeSports.forEach(sport => {
      // Determine main sport category
      let mainCategory: string
      let displayName: string
      let slug: string

      if (sport.key.startsWith('americanfootball_')) {
        mainCategory = 'american-football'
        displayName = 'American Football'
        slug = 'american-football'
      } else if (sport.key.startsWith('soccer_')) {
        mainCategory = 'football'
        displayName = 'Football'
        slug = 'football'
      } else if (sport.key.startsWith('basketball_')) {
        mainCategory = 'basketball'
        displayName = 'Basketball'
        slug = 'basketball'
      } else if (sport.key.startsWith('icehockey_')) {
        mainCategory = 'ice-hockey'
        displayName = 'Ice Hockey'
        slug = 'ice-hockey'
      } else if (sport.key.startsWith('tennis_')) {
        mainCategory = 'tennis'
        displayName = 'Tennis'
        slug = 'tennis'
      } else if (sport.key.startsWith('baseball_')) {
        mainCategory = 'baseball'
        displayName = 'Baseball'
        slug = 'baseball'
      } else if (sport.key.startsWith('mma_')) {
        mainCategory = 'mma'
        displayName = 'MMA'
        slug = 'mma'
      } else if (sport.key.startsWith('boxing_')) {
        mainCategory = 'boxing'
        displayName = 'Boxing'
        slug = 'boxing'
      } else if (sport.key.startsWith('rugbyleague_')) {
        mainCategory = 'rugby-league'
        displayName = 'Rugby League'
        slug = 'rugby-league'
      } else if (sport.key.startsWith('rugbyunion_')) {
        mainCategory = 'rugby-union'
        displayName = 'Rugby Union'
        slug = 'rugby-union'
      } else if (sport.key.startsWith('cricket_')) {
        mainCategory = 'cricket'
        displayName = 'Cricket'
        slug = 'cricket'
      } else {
        // Use group as fallback
        mainCategory = sport.group.toLowerCase().replace(/\s+/g, '-')
        displayName = sport.title || sport.group || sport.key
        slug = sport.key.replace(/_/g, '-')
      }

      // Use the first sport key from each category as the ID
      // For filtering, we'll use the most popular sport from each category
      if (!sportMap.has(mainCategory)) {
        sportMap.set(mainCategory, {
          id: sport.key, // Use first sport key as ID (for filtering)
          name: displayName,
          slug: slug,
          group: sport.group,
          key: sport.key, // Store the actual Odds API key for filtering
          count: 1,
        })
      } else {
        // Increment count for this category
        const existing = sportMap.get(mainCategory)!
        existing.count++
        // Prefer more popular leagues (NFL over NCAAF, EPL over lower leagues)
        const preferredLeagues = ['nfl', 'nba', 'epl', 'nhl', 'mlb']
        const currentLeague = existing.key.split('_').pop()?.toLowerCase() || ''
        const newLeague = sport.key.split('_').pop()?.toLowerCase() || ''
        
        // If new sport is more popular, use it as the key
        if (preferredLeagues.includes(newLeague) && !preferredLeagues.includes(currentLeague)) {
          existing.id = sport.key
          existing.key = sport.key
        }
      }
    })

    const formattedSports = Array.from(sportMap.values())

    // Sort by group, then by name
    formattedSports.sort((a, b) => {
      if (a.group !== b.group) {
        return a.group.localeCompare(b.group)
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      sports: formattedSports,
      grouped: Object.fromEntries(groupedSports),
      total: formattedSports.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching sports list:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sports list',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

