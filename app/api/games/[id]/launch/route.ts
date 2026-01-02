import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'
import { initializeGameSession } from '@/lib/casino-api'

// Get session from cookie
async function getUserId(request: NextRequest): Promise<string | null> {
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

    // Check if game exists and is active
    const game = await queryOne<{
      id: string
      game_url: string
      title: string
      provider_id: string
      min_bet?: number
    }>(
      'SELECT id, game_url, title, provider_id, min_bet FROM games WHERE id = ? AND is_active = 1',
      [gameId]
    )

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found or inactive' },
        { status: 404 }
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

    // Check minimum balance requirement
    if (game.min_bet && totalBalance < game.min_bet) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          minRequired: game.min_bet,
          currentBalance: totalBalance
        },
        { status: 400 }
      )
    }

    // Initialize game session with casino provider
    // This will create a session token and prepare the game URL
    const providerSession = await initializeGameSession(
      gameId,
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
      gameId: game.id,
      gameUrl: providerSession.gameUrl,
      title: game.title,
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

