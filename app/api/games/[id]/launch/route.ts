import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'
import { initializeGameSession, getGames, getEnabledProviders } from '@/lib/casino-api'
import { getSession } from '@/lib/auth'
import { getCachedData } from '@/lib/api-cache'

// Get session from cookie or Authorization header
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const sessionToken = authHeader.replace('Bearer ', '').trim()
    if (sessionToken) {
      try {
        const session = await getSession(sessionToken)
        if (session && session.expires > new Date()) {
          return session.userId
        }
      } catch (error) {
        console.warn('Error validating session from Authorization header:', error)
        // Continue to try cookie
      }
    }
  }
  
  // Fallback to cookie
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null
  
  try {
    const session = await getSession(sessionCookie.value)
    if (session && session.expires > new Date()) {
      return session.userId
    }
    return null
  } catch (error) {
    console.warn('Error validating session from cookie:', error)
    return null
  }
}

/**
 * POST /api/games/:id/launch
 * 
 * Launch a casino game with wallet balance integration
 * - Creates game session in database
 * - Initializes session with casino provider
 * - Tracks user balance for game play
 * - Records game in recent games
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    const gameId = params.id

    // User must be logged in to play
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For Slotegrator games, gameId is the UUID
    // We don't need to check database since games come from Slotegrator API
    // Just validate it's a valid UUID format (32+ hex characters)
    if (!gameId || gameId.length < 32) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // Check if the game's provider is enabled before attempting launch
    // This prevents "provider not enabled" errors from Slotegrator
    try {
      // Get enabled providers
      const enabledProviders = await getCachedData(
        'enabled-providers',
        async () => {
          const providers = await getEnabledProviders('USD')
          return Array.from(providers)
        },
        3600000 // Cache for 1 hour
      )
      const enabledProvidersSet = new Set(enabledProviders)

      // If we have enabled providers list, verify the game's provider
      if (enabledProvidersSet.size > 0) {
        // Fetch game details to get provider name
        // We'll search through a small batch of games to find this one
        const gamesResponse = await getGames({
          fetchAll: false,
          maxPages: 5, // Only fetch first 5 pages to find the game (250 games should be enough)
        })

        const game = gamesResponse.items.find(g => g.uuid === gameId)
        
        if (game) {
          const gameProvider = game.provider.trim()
          const isEnabled = Array.from(enabledProvidersSet).some(
            enabledProvider => enabledProvider.toLowerCase() === gameProvider.toLowerCase()
          )

          if (!isEnabled) {
            console.warn(`[Game Launch] Blocked launch of game "${game.name}" from disabled provider "${gameProvider}"`)
            return NextResponse.json(
              { 
                error: 'This game is not available',
                message: 'This provider is not enabled for your contract'
              },
              { status: 403 }
            )
          }
        } else {
          // Game not found in first 5 pages - might be in later pages
          // We'll let it proceed and let Slotegrator handle the error
          console.warn(`[Game Launch] Game ${gameId} not found in first 5 pages, proceeding with launch`)
        }
      }
    } catch (error) {
      // If provider check fails, log but don't block launch
      // This ensures we don't break the app if limits endpoint is down
      console.error('[Game Launch] Error checking enabled providers:', error)
    }

    // Get user's wallet balance
    const wallet = await queryOne<{ 
      balance: number
      bonus_balance: number
    }>(
      'SELECT balance, bonus_balance FROM wallets WHERE user_id = ?',
      [userId]
    )

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const totalBalance = wallet.balance + wallet.bonus_balance

    // Note: min_bet check removed since we're using Slotegrator games
    // You can add a minimum balance check here if needed

    // Initialize game session with casino provider
    // gameId is the Slotegrator game UUID
    const providerSession = await initializeGameSession(
      gameId, // This is the Slotegrator game UUID
      userId,
      totalBalance
    )

    // Create game session record in database
    const sessionId = nanoid()
    await query(
      `INSERT INTO game_sessions 
        (id, user_id, game_id, session_token, started_at, initial_balance) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [sessionId, userId, gameId, providerSession.sessionId, totalBalance]
    )

    // Track in recent games
    const existingRecent = await queryOne<{ id: string }>(
      'SELECT id FROM recent_games WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )

    if (existingRecent) {
      await query(
        'UPDATE recent_games SET last_played = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ?',
        [userId, gameId]
      )
    } else {
      await query(
        'INSERT INTO recent_games (id, user_id, game_id, last_played) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [nanoid(), userId, gameId]
      )
    }

    // Return game launch information
    return NextResponse.json({
      sessionId,
      gameId: gameId, // Slotegrator UUID
      gameUrl: providerSession.gameUrl,
      balance: totalBalance,
      expiresAt: providerSession.expiresAt,
      message: 'Game session created successfully'
    })
  } catch (error) {
    console.error('Error launching game:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      gameId: params.id,
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to launch game',
        message: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

