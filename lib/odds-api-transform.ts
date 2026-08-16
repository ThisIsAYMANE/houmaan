/**
 * Transform Odds API data to our internal format
 */

import { Event, Bookmaker, Market, Outcome } from './odds-api'
import { americanToDecimal } from './odds-api'

export interface TransformedMatch {
  id: string
  sport_id: string
  sport_key: string // Odds API sport key (e.g., 'americanfootball_nfl', 'soccer_epl')
  sport_name: string // Display name (e.g., 'American Football', 'Football')
  sport_slug: string // URL-friendly slug (e.g., 'american-football', 'football')
  league_id: string
  league_name: string
  league_slug: string
  home_team: string
  away_team: string
  home_team_logo?: string
  away_team_logo?: string
  status: 'upcoming' | 'live' | 'finished'
  match_time: string
  current_score?: string
  home_score?: number
  away_score?: number
  match_minute?: number
  is_live: boolean
  odds?: {
    h2h?: {
      home: number
      draw?: number
      away: number
    }
    spreads?: Array<{
      team: string
      point: number
      price: number
    }>
    totals?: Array<{
      over: number
      under: number
      point: number
    }>
  }
}

/**
 * Map Odds API sport key to our sport slug
 * IMPORTANT: American Football and Soccer/Football are different sports
 */
function mapSportKeyToSlug(sportKey: string): string {
  // American Football (NFL, NCAAF)
  if (sportKey.startsWith('americanfootball_')) {
    return 'american-football'
  }
  
  // Soccer/Football (European football)
  if (sportKey.startsWith('soccer_')) {
    return 'football'
  }
  
  // Other sports
  const sportMap: Record<string, string> = {
    'basketball_nba': 'basketball',
    'basketball_ncaab': 'basketball',
    'basketball_euroleague': 'basketball',
    'basketball_nbl': 'basketball',
    'basketball_wncaab': 'basketball',
    'icehockey_nhl': 'ice-hockey',
    'icehockey_ahl': 'ice-hockey',
    'icehockey_liiga': 'ice-hockey',
    'icehockey_sweden_hockey_league': 'ice-hockey',
    'baseball_mlb': 'baseball',
    'tennis_atp_aus_open_singles': 'tennis',
    'tennis_wta_aus_open_singles': 'tennis',
    'mma_mixed_martial_arts': 'mma',
    'boxing_boxing': 'boxing',
    'rugbyleague_nrl': 'rugby-league',
    'rugbyunion_six_nations': 'rugby-union',
    'cricket_big_bash': 'cricket',
    'cricket_odi': 'cricket',
  }
  
  // Check exact match first
  if (sportMap[sportKey]) {
    return sportMap[sportKey]
  }
  
  // Extract base sport from key
  const baseSport = sportKey.split('_')[0]
  return baseSport || 'other'
}

/**
 * Map Odds API sport key to our sport name
 * IMPORTANT: American Football and Soccer/Football are different sports
 */
function mapSportKeyToName(sportKey: string): string {
  // American Football (NFL, NCAAF)
  if (sportKey.startsWith('americanfootball_')) {
    return 'American Football'
  }
  
  // Soccer/Football (European football)
  if (sportKey.startsWith('soccer_')) {
    return 'Football' // European Football/Soccer
  }
  
  // Other sports
  const sportMap: Record<string, string> = {
    'basketball_nba': 'Basketball',
    'basketball_ncaab': 'Basketball',
    'basketball_euroleague': 'Basketball',
    'basketball_nbl': 'Basketball',
    'basketball_wncaab': 'Basketball',
    'icehockey_nhl': 'Ice Hockey',
    'icehockey_ahl': 'Ice Hockey',
    'icehockey_liiga': 'Ice Hockey',
    'icehockey_sweden_hockey_league': 'Ice Hockey',
    'baseball_mlb': 'Baseball',
    'tennis_atp_aus_open_singles': 'Tennis',
    'tennis_wta_aus_open_singles': 'Tennis',
    'mma_mixed_martial_arts': 'MMA',
    'boxing_boxing': 'Boxing',
    'rugbyleague_nrl': 'Rugby League',
    'rugbyunion_six_nations': 'Rugby Union',
    'cricket_big_bash': 'Cricket',
    'cricket_odi': 'Cricket',
  }
  
  // Check exact match first
  if (sportMap[sportKey]) {
    return sportMap[sportKey]
  }
  
  // Extract base sport from key and capitalize
  const baseSport = sportKey.split('_')[0]
  return baseSport.charAt(0).toUpperCase() + baseSport.slice(1)
}

/**
 * Extract league name from sport key
 */
function extractLeagueName(sportKey: string): string {
  // Remove common prefixes
  const parts = sportKey.split('_')
  if (parts.length > 1) {
    // Return the league part (e.g., "nfl", "epl", "nba")
    return parts.slice(1).join(' ').toUpperCase()
  }
  return sportKey.toUpperCase()
}

/**
 * Determine match status from commence_time
 * Uses sport-specific game durations to avoid falsely marking live games as 'finished'.
 * Issue #5/#D: Extended cutoffs — NFL ~3.5h, soccer ~2h, hockey ~2.5h, basketball ~2.5h
 */
function getMatchStatus(commenceTime: string, sportKey?: string): 'upcoming' | 'live' | 'finished' {
  const now = new Date()
  const matchTime = new Date(commenceTime)
  const diffMs = matchTime.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  // Determine sport-specific duration in hours
  let liveDurationHours = 3.5 // conservative default
  if (sportKey) {
    if (sportKey.startsWith('americanfootball_')) {
      liveDurationHours = 5 // NFL games can run 3.5-4h; buffer to 5h
    } else if (sportKey.startsWith('soccer_')) {
      liveDurationHours = 2.5 // 90min + extra time = ~2h; buffer to 2.5h
    } else if (sportKey.startsWith('basketball_')) {
      liveDurationHours = 3 // NBA ~2.5h; buffer to 3h
    } else if (sportKey.startsWith('icehockey_')) {
      liveDurationHours = 4 // NHL + OT/shootout up to 3.5h; buffer to 4h
    } else if (sportKey.startsWith('baseball_')) {
      liveDurationHours = 4 // MLB ~3h; buffer to 4h
    } else if (sportKey.startsWith('tennis_')) {
      liveDurationHours = 5 // Grand slams can be 4-5h
    } else if (sportKey.startsWith('mma_') || sportKey.startsWith('boxing_')) {
      liveDurationHours = 4 // Cards can be long
    }
  }

  // If match started more than liveDurationHours ago, consider it finished
  if (diffHours < -liveDurationHours) {
    return 'finished'
  }

  // If match started but within the live window, consider it live
  if (diffHours < 0) {
    return 'live'
  }

  return 'upcoming'
}

/**
 * Extract best odds from bookmakers for a market
 */
function getBestOddsForMarket(
  bookmakers: Bookmaker[],
  marketKey: string,
  outcomeName?: string
): number | null {
  const market = bookmakers
    .flatMap(b => b.markets)
    .find(m => m.key === marketKey)

  if (!market || market.outcomes.length === 0) {
    return null
  }

  let targetOutcome: Outcome | undefined
  if (outcomeName) {
    targetOutcome = market.outcomes.find(o => 
      o.name.toLowerCase().includes(outcomeName.toLowerCase()) ||
      outcomeName.toLowerCase().includes(o.name.toLowerCase())
    )
  } else {
    targetOutcome = market.outcomes[0]
  }

  if (!targetOutcome) {
    return null
  }

  // Find the best odds for this outcome across all bookmakers
  let bestPrice = targetOutcome.price
  
  for (const bookmaker of bookmakers) {
    const bookmakerMarket = bookmaker.markets.find(m => m.key === marketKey)
    if (!bookmakerMarket) continue

    const outcome = bookmakerMarket.outcomes.find(o => 
      !outcomeName || 
      o.name.toLowerCase().includes(outcomeName.toLowerCase()) ||
      outcomeName.toLowerCase().includes(o.name.toLowerCase())
    )

    if (outcome) {
      // For positive odds, higher is better
      // For negative odds, less negative is better
      if (outcome.price > 0 && bestPrice > 0) {
        if (outcome.price > bestPrice) {
          bestPrice = outcome.price
        }
      } else if (outcome.price < 0 && bestPrice < 0) {
        if (outcome.price > bestPrice) {
          bestPrice = outcome.price
        }
      } else if (outcome.price > 0 && bestPrice < 0) {
        bestPrice = outcome.price
      }
    }
  }

  return bestPrice
}

/**
 * Transform Odds API Event to our Match format
 */
export function transformOddsApiEventToMatch(event: Event): TransformedMatch {
  const sportSlug = mapSportKeyToSlug(event.sport_key)
  const sportName = mapSportKeyToName(event.sport_key)
  const leagueName = extractLeagueName(event.sport_key)
  // Issue #D: Pass sport_key to get correct duration
  const status = getMatchStatus(event.commence_time, event.sport_key)
  const isLive = status === 'live'

  // Extract odds
  const h2hMarket = event.bookmakers
    .flatMap(b => b.markets)
    .find(m => m.key === 'h2h')

  let h2hOdds: { home: number; draw?: number; away: number } | undefined
  if (h2hMarket) {
    // Find home, draw, and away outcomes
    const homeOutcome = h2hMarket.outcomes.find(o => 
      o.name.toLowerCase() === event.home_team.toLowerCase() ||
      event.home_team.toLowerCase().includes(o.name.toLowerCase()) ||
      o.name.toLowerCase().includes(event.home_team.toLowerCase())
    )
    
    const awayOutcome = h2hMarket.outcomes.find(o => 
      o.name.toLowerCase() === event.away_team.toLowerCase() ||
      event.away_team.toLowerCase().includes(o.name.toLowerCase()) ||
      o.name.toLowerCase().includes(event.away_team.toLowerCase())
    )
    
    const drawOutcome = h2hMarket.outcomes.find(o => 
      o.name.toLowerCase().includes('draw') ||
      o.name.toLowerCase().includes('tie') ||
      o.name.toLowerCase().includes('x')
    )

    if (homeOutcome && awayOutcome) {
      // Issue #12: Odds now come as decimal directly from API (oddsFormat: 'decimal')
      // No conversion needed. If odds look like american (large absolute values), they're already decimal.
      const homePrice = homeOutcome.price
      const awayPrice = awayOutcome.price
      const drawPrice = drawOutcome?.price

      h2hOdds = {
        home: homePrice,
        away: awayPrice,
        ...(drawPrice !== undefined && { draw: drawPrice }),
      }
    }
  }

  return {
    id: event.id,
    sport_id: event.sport_key,
    sport_key: event.sport_key, // Include original Odds API key for filtering
    sport_name: sportName, // e.g., "American Football" or "Football" (Soccer)
    sport_slug: sportSlug, // e.g., "american-football" or "football"
    league_id: event.sport_key, // Use sport_key as league_id for now
    league_name: leagueName, // e.g., "NFL", "EPL", "NBA"
    league_slug: event.sport_key.replace(/_/g, '-'),
    home_team: event.home_team,
    away_team: event.away_team,
    status,
    match_time: event.commence_time,
    is_live: isLive,
    ...(h2hOdds && {
      odds: {
        h2h: h2hOdds,
      },
    }),
  }
}

/**
 * Transform multiple Odds API Events to Matches
 */
export function transformOddsApiEventsToMatches(events: Event[]): TransformedMatch[] {
  return events.map(transformOddsApiEventToMatch)
}

