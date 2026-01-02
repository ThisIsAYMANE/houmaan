/**
 * Sports Data Synchronization Service
 * 
 * This service handles fetching sports data from external APIs
 * and syncing it to the local database.
 * 
 * Supported APIs:
 * - API-Football (https://www.api-football.com/)
 * - The Odds API (https://the-odds-api.com/)
 */

import { query } from './db'

interface SportsAPIConfig {
  apiKey: string
  apiUrl: string
}

interface Match {
  id: string
  sport_id: string
  league_id: string
  home_team: string
  away_team: string
  home_team_logo?: string
  away_team_logo?: string
  match_time: string
  status: string
  is_live: boolean
}

interface Odds {
  match_id: string
  market_type: string
  selection: string
  odds: number
}

/**
 * Initialize sports API configuration
 */
export function getSportsAPIConfig(): SportsAPIConfig {
  const apiKey = process.env.SPORTS_API_KEY || ''
  const apiUrl = process.env.SPORTS_API_URL || 'https://v3.football.api-sports.io'
  
  if (!apiKey) {
    console.warn('⚠️ SPORTS_API_KEY not configured. Using mock data.')
  }
  
  return { apiKey, apiUrl }
}

/**
 * Fetch live matches from external API
 * 
 * TODO: Implement actual API integration when SPORTS_API_KEY is configured
 */
export async function fetchLiveMatches(): Promise<Match[]> {
  const config = getSportsAPIConfig()
  
  if (!config.apiKey) {
    console.log('📝 Using mock data - SPORTS_API_KEY not configured')
    return []
  }
  
  try {
    // TODO: Replace with actual API call
    // Example for API-Football:
    /*
    const response = await fetch(`${config.apiUrl}/fixtures?live=all`, {
      headers: {
        'x-rapidapi-key': config.apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    })
    
    const data = await response.json()
    
    // Transform API response to our format
    return data.response.map((fixture: any) => ({
      id: `api-${fixture.fixture.id}`,
      sport_id: 'football',
      league_id: `league-${fixture.league.id}`,
      home_team: fixture.teams.home.name,
      away_team: fixture.teams.away.name,
      home_team_logo: fixture.teams.home.logo,
      away_team_logo: fixture.teams.away.logo,
      match_time: fixture.fixture.date,
      status: fixture.fixture.status.short,
      is_live: fixture.fixture.status.short === '1H' || fixture.fixture.status.short === '2H',
    }))
    */
    
    console.log('🔌 API integration pending - add your API key to .env')
    return []
  } catch (error) {
    console.error('Error fetching live matches:', error)
    return []
  }
}

/**
 * Fetch upcoming matches from external API
 */
export async function fetchUpcomingMatches(days: number = 7): Promise<Match[]> {
  const config = getSportsAPIConfig()
  
  if (!config.apiKey) {
    console.log('📝 Using mock data - SPORTS_API_KEY not configured')
    return []
  }
  
  try {
    // TODO: Implement API call for upcoming matches
    // Example:
    /*
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)
    
    const response = await fetch(
      `${config.apiUrl}/fixtures?from=${today.toISOString().split('T')[0]}&to=${futureDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'x-rapidapi-key': config.apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      }
    )
    
    // Transform and return
    */
    
    return []
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
    return []
  }
}

/**
 * Fetch odds for a specific match
 */
export async function fetchMatchOdds(matchId: string): Promise<Odds[]> {
  const config = getSportsAPIConfig()
  
  if (!config.apiKey) {
    return []
  }
  
  try {
    // TODO: Implement odds fetching
    // Example for The Odds API:
    /*
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${config.apiKey}&regions=eu&markets=h2h,spreads,totals`,
    )
    
    const data = await response.json()
    
    // Transform odds to our format
    */
    
    return []
  } catch (error) {
    console.error('Error fetching odds:', error)
    return []
  }
}

/**
 * Sync matches to database
 */
export async function syncMatchesToDatabase(matches: Match[]): Promise<void> {
  for (const match of matches) {
    try {
      // Check if match exists
      const existing = await query(
        'SELECT id FROM matches WHERE id = ?',
        [match.id]
      )
      
      if (existing.rows.length > 0) {
        // Update existing match
        await query(
          `UPDATE matches 
           SET status = ?, is_live = ?, match_time = ?
           WHERE id = ?`,
          [match.status, match.is_live ? 1 : 0, match.match_time, match.id]
        )
      } else {
        // Insert new match
        await query(
          `INSERT INTO matches (
            id, sport_id, league_id, home_team, away_team, 
            home_team_logo, away_team_logo, match_time, status, is_live
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            match.id,
            match.sport_id,
            match.league_id,
            match.home_team,
            match.away_team,
            match.home_team_logo,
            match.away_team_logo,
            match.match_time,
            match.status,
            match.is_live ? 1 : 0,
          ]
        )
      }
    } catch (error) {
      console.error(`Error syncing match ${match.id}:`, error)
    }
  }
}

/**
 * Sync odds to database
 */
export async function syncOddsToDatabase(odds: Odds[]): Promise<void> {
  for (const odd of odds) {
    try {
      await query(
        `INSERT OR REPLACE INTO odds (
          match_id, market_type, selection, odds, updated_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [odd.match_id, odd.market_type, odd.selection, odd.odds]
      )
    } catch (error) {
      console.error(`Error syncing odds:`, error)
    }
  }
}

/**
 * Main sync function - call this periodically (e.g., every 30 seconds for live matches)
 */
export async function syncSportsData(): Promise<{
  matchesSynced: number
  oddsSynced: number
  errors: string[]
}> {
  const errors: string[] = []
  let matchesSynced = 0
  let oddsSynced = 0
  
  try {
    // Fetch and sync live matches
    const liveMatches = await fetchLiveMatches()
    if (liveMatches.length > 0) {
      await syncMatchesToDatabase(liveMatches)
      matchesSynced += liveMatches.length
    }
    
    // Fetch and sync upcoming matches
    const upcomingMatches = await fetchUpcomingMatches()
    if (upcomingMatches.length > 0) {
      await syncMatchesToDatabase(upcomingMatches)
      matchesSynced += upcomingMatches.length
    }
    
    // Fetch odds for all matches
    // TODO: Implement odds sync
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMsg)
    console.error('Sports data sync error:', errorMsg)
  }
  
  return {
    matchesSynced,
    oddsSynced,
    errors,
  }
}

/**
 * Get sync status/stats
 */
export async function getSyncStatus() {
  try {
    const totalMatches = await query('SELECT COUNT(*) as count FROM matches')
    const liveMatches = await query('SELECT COUNT(*) as count FROM matches WHERE is_live = 1')
    const upcomingMatches = await query(
      `SELECT COUNT(*) as count FROM matches 
       WHERE status = 'upcoming' AND match_time > datetime('now')`
    )
    
    return {
      totalMatches: totalMatches.rows[0].count,
      liveMatches: liveMatches.rows[0].count,
      upcomingMatches: upcomingMatches.rows[0].count,
      apiConfigured: !!process.env.SPORTS_API_KEY,
    }
  } catch (error) {
    console.error('Error getting sync status:', error)
    return {
      totalMatches: 0,
      liveMatches: 0,
      upcomingMatches: 0,
      apiConfigured: false,
    }
  }
}

