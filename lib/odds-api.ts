/**
 * The Odds API Client
 * 
 * Documentation: https://the-odds-api.com/liveapi/guides/v4/
 * Base URL: https://api.the-odds-api.com/v4
 */

export interface OddsApiConfig {
  apiKey: string
  baseUrl: string
}

export interface Sport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

export interface Bookmaker {
  key: string
  title: string
  last_update: string
  markets: Market[]
}

export interface Market {
  key: string
  last_update?: string
  outcomes: Outcome[]
}

export interface Outcome {
  name: string
  price: number
  point?: number
  description?: string
}

export interface Event {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

export interface OddsApiResponse<T> {
  success?: boolean
  data?: T
  message?: string
}

/**
 * Get Odds API configuration
 */
export function getOddsApiConfig(): OddsApiConfig {
  const apiKey = process.env.ODDS_API_KEY
  const baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4'

  if (!apiKey) {
    throw new Error(
      'ODDS_API_KEY not configured. Please set ODDS_API_KEY in your .env file.'
    )
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
  }
}

/**
 * Make a request to the Odds API
 * Logs quota usage headers on every response.
 */
async function makeOddsApiRequest<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const config = getOddsApiConfig()
  
  // Build URL with query parameters
  const url = new URL(`${config.baseUrl}${endpoint}`)
  
  // Add API key to params
  url.searchParams.append('apiKey', config.apiKey)
  
  // Add other parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  // ── Quota tracking ────────────────────────────────────────────
  const remaining = response.headers.get('x-requests-remaining')
  const used = response.headers.get('x-requests-used')
  const last = response.headers.get('x-requests-last')
  if (remaining !== null) {
    console.log(`[OddsAPI] Quota — used: ${used}, remaining: ${remaining}, last call cost: ${last}`)
    if (parseInt(remaining) < 50) {
      console.warn(`[OddsAPI] ⚠️  LOW QUOTA: only ${remaining} requests remaining!`)
    }
  }

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Odds API request failed: ${response.status} ${response.statusText}`
    
    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.message || errorData.detail || errorMessage
    } catch {
      if (errorText) {
        errorMessage = errorText
      }
    }

    console.error('Odds API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorMessage,
      url: url.toString().replace(config.apiKey, '***'),
    })

    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * GET /sports - Get available sports
 */
export async function getSports(): Promise<Sport[]> {
  try {
    const sports = await makeOddsApiRequest<Sport[]>('/sports')
    return sports
  } catch (error) {
    console.error('Error fetching sports:', error)
    throw error
  }
}

/**
 * GET /sports/{sport}/odds - Get odds for a sport
 * 
 * @param sportKey - Sport key (e.g., 'americanfootball_nfl')
 * @param options.regions - Comma-separated regions. Default: 'eu,uk,us' (covers soccer bookmakers)
 * @param options.markets - Comma-separated markets. Default: 'h2h'
 * @param options.oddsFormat - 'decimal' (default, no conversion needed) or 'american'
 * @param options.commenceTimeFrom - ISO 8601 UTC. Filter events starting after this time.
 * @param options.commenceTimeTo - ISO 8601 UTC. Filter events starting before this time.
 */
export async function getSportOdds(
  sportKey: string,
  options?: {
    regions?: string
    markets?: string
    oddsFormat?: 'american' | 'decimal'
    dateFormat?: 'iso' | 'unix'
    commenceTimeFrom?: string
    commenceTimeTo?: string
  }
): Promise<Event[]> {
  try {
    const params: Record<string, string> = {}
    
    if (options?.regions) {
      params.regions = options.regions
    }
    
    if (options?.markets) {
      params.markets = options.markets
    }

    // Default to decimal to avoid conversion overhead
    params.oddsFormat = options?.oddsFormat ?? 'decimal'
    
    if (options?.dateFormat) {
      params.dateFormat = options.dateFormat
    }

    if (options?.commenceTimeFrom) {
      params.commenceTimeFrom = options.commenceTimeFrom
    }

    if (options?.commenceTimeTo) {
      params.commenceTimeTo = options.commenceTimeTo
    }

    const events = await makeOddsApiRequest<Event[]>(`/sports/${sportKey}/odds`, params)
    return events
  } catch (error) {
    console.error(`Error fetching odds for sport ${sportKey}:`, error)
    throw error
  }
}

/**
 * GET /sports/{sport}/scores - Get scores for a sport
 */
export async function getSportScores(
  sportKey: string,
  options?: {
    daysFrom?: number
    dateFormat?: 'iso' | 'unix'
  }
): Promise<Event[]> {
  try {
    const params: Record<string, string> = {}
    
    if (options?.daysFrom) {
      params.daysFrom = String(options.daysFrom)
    }
    
    if (options?.dateFormat) {
      params.dateFormat = options.dateFormat
    }

    const events = await makeOddsApiRequest<Event[]>(`/sports/${sportKey}/scores`, params)
    return events
  } catch (error) {
    console.error(`Error fetching scores for sport ${sportKey}:`, error)
    throw error
  }
}

/**
 * GET /sports/{sport}/events/{eventId}/odds - Get odds for a specific event
 * 
 * NOTE: The /odds suffix is required — this was previously a bug (missing /odds).
 */
export async function getEventOdds(
  sportKey: string,
  eventId: string,
  options?: {
    regions?: string
    markets?: string
    oddsFormat?: 'american' | 'decimal'
    dateFormat?: 'iso' | 'unix'
  }
): Promise<Event> {
  try {
    const params: Record<string, string> = {}
    
    if (options?.regions) {
      params.regions = options.regions
    }
    
    if (options?.markets) {
      params.markets = options.markets
    }

    params.oddsFormat = options?.oddsFormat ?? 'decimal'
    
    if (options?.dateFormat) {
      params.dateFormat = options.dateFormat
    }

    // FIXED: correct endpoint is /sports/{sport}/events/{eventId}/odds
    const event = await makeOddsApiRequest<Event>(
      `/sports/${sportKey}/events/${eventId}/odds`,
      params
    )
    return event
  } catch (error) {
    console.error(`Error fetching odds for event ${eventId}:`, error)
    throw error
  }
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return parseFloat(((americanOdds / 100) + 1).toFixed(2))
  } else {
    return parseFloat(((100 / Math.abs(americanOdds)) + 1).toFixed(2))
  }
}

/**
 * Convert decimal odds to American odds
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100)
  } else {
    return Math.round(-100 / (decimalOdds - 1))
  }
}

/**
 * Get the best odds from multiple bookmakers for a market
 */
export function getBestOdds(bookmakers: Bookmaker[], marketKey: string): {
  bestOdds: number
  bookmaker: string
  outcome: Outcome
} | null {
  const market = bookmakers
    .flatMap(b => b.markets)
    .find(m => m.key === marketKey)

  if (!market || market.outcomes.length === 0) {
    return null
  }

  let bestOutcome = market.outcomes[0]
  let bestBookmaker = bookmakers.find(b => 
    b.markets.some(m => m.key === marketKey && m.outcomes.includes(bestOutcome))
  )?.title || 'Unknown'

  for (const bookmaker of bookmakers) {
    const bookmakerMarket = bookmaker.markets.find(m => m.key === marketKey)
    if (!bookmakerMarket) continue

    for (const outcome of bookmakerMarket.outcomes) {
      // Decimal odds: higher is always better
      if (outcome.price > bestOutcome.price) {
        bestOutcome = outcome
        bestBookmaker = bookmaker.title
      }
    }
  }

  return {
    bestOdds: bestOutcome.price,
    bookmaker: bestBookmaker,
    outcome: bestOutcome,
  }
}

// ── Live Scores ──────────────────────────────────────────────────────────────

/**
 * Typed response shape returned by /sports/{sport}/scores
 * Used by app/api/sports/scores/route.ts
 */
export interface ScoreEntry {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  completed: boolean
  home_team: string
  away_team: string
  scores: Array<{
    name: string   // team name
    score: string  // e.g. "2"
  }> | null
  last_update: string | null
}
