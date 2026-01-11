import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'
import { initializeGameSession } from '@/lib/casino-api'

// Get session from cookie or Authorization header
async function getUserId(request: NextRequest): Promise<string | null> {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const sessionToken = authHeader.replace('Bearer ', '').trim()
    if (sessionToken) {
      try {
        const session = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP',
          [sessionToken]
        )
        if (session) return session.user_id
      } catch {
        // Continue to try cookie
      }
    }
  }
  
  // Fallback to cookie
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null
  
  try {
    const session = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP',
      [sessionCookie.value]
    )
    return session?.user_id || null
  } catch {
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
    return NextResponse.json(
      { error: 'Failed to launch game' },
      { status: 500 }
    )
  }
}

