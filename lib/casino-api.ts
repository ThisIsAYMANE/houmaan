import crypto from 'crypto'

// ============================================
// Types
// ============================================

export interface SelfValidateResponse {
  success: boolean
  log: string[]
}

export interface GameSessionInitResponse {
  sessionId: string
  gameUrl: string
  expiresAt: string
}

export interface CasinoApiConfig {
  merchantId: string
  merchantKey: string
  baseUrl: string
}

// ============================================
// Configuration
// ============================================

export function getCasinoConfig(): CasinoApiConfig {
  const merchantId = process.env.CASINO_MERCHANT_ID
  const merchantKey = process.env.CASINO_MERCHANT_KEY
  const baseUrl = process.env.CASINO_API_BASE_URL

  if (!merchantId || !merchantKey || !baseUrl) {
    throw new Error(
      'Casino API configuration missing. Please set CASINO_MERCHANT_ID, CASINO_MERCHANT_KEY, and CASINO_API_BASE_URL environment variables.'
    )
  }

  return {
    merchantId,
    merchantKey,
    baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
  }
}

// ============================================
// X-Sign Authentication
// ============================================

/**
 * Calculate X-Sign for outgoing requests
 * 
 * Algorithm:
 * 1. Merge request parameters with authorization headers
 * 2. Sort resulting array by key (ascending)
 * 3. Generate URL-encoded query string
 * 4. Use SHA1 HMAC with Merchant Key for signing
 */
export function calculateXSign(
  params: Record<string, any>,
  headers: Record<string, string>,
  merchantKey: string
): string {
  // Merge params and headers
  const mergedParams = { ...params, ...headers }

  // Sort by key (ascending)
  const sortedKeys = Object.keys(mergedParams).sort()

  // Build query string
  const queryString = sortedKeys
    .map((key) => {
      const value = mergedParams[key]
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    })
    .join('&')

  // Generate SHA1 HMAC
  const signature = crypto
    .createHmac('sha1', merchantKey)
    .update(queryString)
    .digest('hex')

  return signature
}

/**
 * Validate X-Sign for incoming requests
 */
export function validateXSign(
  params: Record<string, any>,
  headers: Record<string, string>,
  receivedSign: string,
  merchantKey: string
): boolean {
  const expectedSign = calculateXSign(params, headers, merchantKey)
  return expectedSign === receivedSign
}

/**
 * Generate authorization headers for Casino API requests
 */
function generateAuthHeaders(
  merchantId: string,
  merchantKey: string,
  requestParams: Record<string, any> = {}
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const headers = {
    'X-Merchant-Id': merchantId,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
  }

  // Calculate X-Sign
  const xSign = calculateXSign(requestParams, headers, merchantKey)
  headers['X-Sign'] = xSign

  return headers
}

// ============================================
// API Client
// ============================================

/**
 * Make authenticated request to Casino API
 */
async function makeCasinoRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  params?: Record<string, any>,
  bodyParams?: Record<string, any>
): Promise<T> {
  const config = getCasinoConfig()
  
  // For GET requests, params go in URL query string
  // For POST requests, params go in body
  let url = `${config.baseUrl}${endpoint}`
  let body: string | undefined

  // For POST requests, use bodyParams if provided, otherwise use params
  const requestParams = method === 'POST' && bodyParams ? bodyParams : params

  if (method === 'GET' && params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString()
    if (queryString) {
      url += (endpoint.includes('?') ? '&' : '?') + queryString
    }
  } else if (method === 'POST' && requestParams) {
    const formData = new URLSearchParams()
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    body = formData.toString()
  }

  // Generate auth headers (requestParams are used for X-Sign calculation)
  const authHeaders = generateAuthHeaders(
    config.merchantId,
    config.merchantKey,
    requestParams || {}
  )

  // Prepare request
  const headers: Record<string, string> = {
    ...authHeaders,
    'Accept': 'application/json',
  }

  // Only add Content-Type for POST requests
  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  let requestOptions: RequestInit = {
    method,
    headers,
  }

  if (body) {
    requestOptions.body = body
  }

  // Make request
  const response = await fetch(url, requestOptions)

  // Handle errors
  if (!response.ok) {
    let errorMessage = `Casino API request failed: ${response.status} ${response.statusText}`
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.name || errorMessage
    } catch {
      // If response is not JSON, use status text
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

// ============================================
// Self Validation
// ============================================

/**
 * POST /self-validate - Self Validation
 * 
 * Allows integrator to check if implementation is correct.
 * Requires active game session (opened within 15 minutes).
 * 
 * @returns Validation result with success status and log messages
 */
export async function selfValidate(): Promise<SelfValidateResponse> {
  try {
    const response = await makeCasinoRequest<SelfValidateResponse>(
      '/self-validate',
      'POST'
    )

    return response
  } catch (error) {
    console.error('Self-validation error:', error)
    throw error
  }
}

// ============================================
// Games
// ============================================

export interface Game {
  uuid: string
  name: string
  image: string
  type: string
  provider: string
  provider_id: number
  technology: string
  has_lobby: number
  is_mobile: number
  has_freespins: number
  has_tables: number
  freespin_valid_until_full_day?: number
  label?: string
  tags?: Array<{ code: string; label: string }>
  parameters?: {
    rtp?: number
    volatility?: string
    reels_count?: string
    lines_count?: number
  }
  images?: Array<{
    name: string
    file: string
    url: string
    type: string
  }>
  related_games?: Game[]
}

export interface GamesResponse {
  items: Game[]
  _links?: {
    self?: { href: string }
    next?: { href: string }
    last?: { href: string }
  }
  _meta?: {
    totalCount: number
    pageCount: number
    currentPage: number
    perPage: number
  }
}

/**
 * GET /games - Retrieve Games List
 * 
 * Returns collection of games available for your Merchant ID.
 * Supports pagination to fetch all games.
 * 
 * @param options.expand - Additional object expansions (tags, parameters, images, related_games)
 * @param options.fetchAll - If true, fetches all pages (default: false)
 * @param options.maxPages - Maximum number of pages to fetch (default: 200)
 */
export async function getGames(options?: {
  expand?: string
  fetchAll?: boolean
  maxPages?: number
}): Promise<GamesResponse> {
  try {
    const queryParams: Record<string, any> = {}
    
    if (options?.expand) {
      queryParams.expand = options.expand
    }

    // Fetch first page
    const firstPage = await makeCasinoRequest<GamesResponse>(
      '/games',
      'GET',
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    )

    // Determine max pages to fetch
    const maxPages = options?.maxPages || (options?.fetchAll ? 200 : 1)

    // If fetchAll is false and maxPages is 1, return first page only
    if (!options?.fetchAll && maxPages <= 1) {
      return firstPage
    }

    // Fetch remaining pages
    const allGames = [...firstPage.items]
    let currentPage = 1
    const totalPages = firstPage._meta?.pageCount || 1

    // Log what we're doing
    if (maxPages > 1) {
      console.log(`Fetching games: ${totalPages} total pages, ${firstPage._meta?.totalCount || 0} total games, fetching up to ${maxPages} pages (maxPages=${maxPages})`)
    }

    // Fetch remaining pages if there are more
    // Add a small delay between requests to avoid rate limiting (staging allows 100 req/sec)
    // IMPORTANT: Stop when we reach maxPages (don't fetch more than needed)
    while (currentPage < totalPages && currentPage < maxPages) {
      try {
        currentPage++
        
        // CRITICAL: Check if we've exceeded maxPages before making the request
        if (currentPage > maxPages) {
          console.log(`Stopping: currentPage (${currentPage}) > maxPages (${maxPages})`)
          break
        }
        
        // Add delay to avoid rate limiting (10ms = 100 req/sec max)
        if (currentPage > 1) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }

        const nextParams: Record<string, any> = { ...queryParams, page: currentPage }

        const nextPage = await makeCasinoRequest<GamesResponse>(
          '/games',
          'GET',
          nextParams
        )

        allGames.push(...nextPage.items)

        // Log progress every 10 pages
        if (currentPage % 10 === 0) {
          console.log(`Fetched ${currentPage}/${maxPages} pages (max), ${allGames.length} games so far...`)
        }

        // Break if no more items
        if (nextPage.items.length === 0) {
          console.log(`No more items on page ${currentPage}, stopping`)
          break
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error)
        // Continue with what we have rather than failing completely
        break
      }
    }

    console.log(`Finished fetching: ${allGames.length} games from ${currentPage} pages`)

    return {
      items: allGames,
      _meta: {
        totalCount: allGames.length,
        pageCount: 1,
        currentPage: 1,
        perPage: allGames.length,
      },
      _links: firstPage._links,
    }
  } catch (error) {
    console.error('Error fetching games:', error)
    throw error
  }
}

// ============================================
// Game Session Initialization
// ============================================

interface InitGameParams {
  game_uuid: string
  player_id: string
  player_name: string
  currency: string
  session_id: string
  device?: string
  return_url?: string
  language?: string
  email?: string
  lobby_data?: string
}

interface InitGameResponse {
  url: string
}

/**
 * Initialize game session with casino provider
 * 
 * Calls POST /games/init to get the game URL for player redirection.
 * 
 * @param gameId - Game UUID from Slotegrator
 * @param userId - User ID on integrator side
 * @param balance - Player balance (for validation)
 * @param options - Additional options (player name, currency, language, etc.)
 */
export async function initializeGameSession(
  gameId: string,
  userId: string,
  balance: number,
  options?: {
    playerName?: string
    currency?: string
    language?: string
    email?: string
    device?: 'desktop' | 'mobile'
    returnUrl?: string
    lobbyData?: string
  }
): Promise<GameSessionInitResponse> {
  try {
    const config = getCasinoConfig()
    
    // Generate unique session ID
    const sessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Get user info from database
    const { queryOne } = await import('@/lib/db')
    
    // Get user email and username
    const user = await queryOne<{ email: string; username: string | null }>(
      'SELECT email, username FROM users WHERE id = ?',
      [userId]
    )
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Get user profile for currency and language
    const profile = await queryOne<{ currency: string; language: string; first_name: string | null; last_name: string | null }>(
      'SELECT currency, language, first_name, last_name FROM user_profiles WHERE user_id = ?',
      [userId]
    )
    
    // Prepare parameters for /games/init
    const params: InitGameParams = {
      game_uuid: gameId,
      player_id: userId,
      player_name: options?.playerName || 
                   (profile?.first_name && profile?.last_name 
                     ? `${profile.first_name} ${profile.last_name}` 
                     : user.username || user.email.split('@')[0] || 'Player'),
      currency: options?.currency || profile?.currency || 'MAD',
      session_id: sessionId,
      device: options?.device || 'desktop',
      return_url: options?.returnUrl || process.env.CASINO_TEST_AREA_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/casino`,
      language: options?.language || profile?.language || 'fr',
      email: options?.email || user.email,
    }
    
    // Add lobby_data if provided (for games with lobby)
    if (options?.lobbyData) {
      params.lobby_data = options.lobbyData
    }
    
    // Call POST /games/init
    const response = await makeCasinoRequest<InitGameResponse>(
      '/games/init',
      'POST',
      undefined,
      params
    )
    
    if (!response.url) {
      throw new Error('No game URL returned from Slotegrator')
    }
    
    return {
      sessionId,
      gameUrl: response.url,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    }
  } catch (error) {
    console.error('Error initializing game session:', error)
    throw error
  }
}

