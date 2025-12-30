import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

// Get session from cookie (simplified - in production use proper auth)
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    const gameId = params.id

    // Check if game exists and get game URL
    const game = await queryOne<{
      id: string
      game_url: string
      title: string
    }>(
      'SELECT id, game_url, title FROM games WHERE id = ? AND is_active = 1',
      [gameId]
    )

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Track recent game if user is logged in
    if (userId) {
      // Check if already exists
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM recent_games WHERE user_id = ? AND game_id = ?',
        [userId, gameId]
      )

      if (existing) {
        // Update last_played
        await query(
          'UPDATE recent_games SET last_played = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ?',
          [userId, gameId]
        )
      } else {
        // Insert new
        await query(
          'INSERT INTO recent_games (id, user_id, game_id, last_played) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [nanoid(), userId, gameId]
        )
      }
    }

    // Return game launch URL and session info
    return NextResponse.json({
      gameId: game.id,
      gameUrl: game.game_url,
      title: game.title,
      launchUrl: game.game_url, // In production, this might include session tokens
      message: 'Game launch initiated'
    })
  } catch (error) {
    console.error('Error launching game:', error)
    return NextResponse.json(
      { error: 'Failed to launch game' },
      { status: 500 }
    )
  }
}


import { nanoid } from 'nanoid'

// Get session from cookie (simplified - in production use proper auth)
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    const gameId = params.id

    // Check if game exists and get game URL
    const game = await queryOne<{
      id: string
      game_url: string
      title: string
    }>(
      'SELECT id, game_url, title FROM games WHERE id = ? AND is_active = 1',
      [gameId]
    )

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Track recent game if user is logged in
    if (userId) {
      // Check if already exists
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM recent_games WHERE user_id = ? AND game_id = ?',
        [userId, gameId]
      )

      if (existing) {
        // Update last_played
        await query(
          'UPDATE recent_games SET last_played = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ?',
          [userId, gameId]
        )
      } else {
        // Insert new
        await query(
          'INSERT INTO recent_games (id, user_id, game_id, last_played) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [nanoid(), userId, gameId]
        )
      }
    }

    // Return game launch URL and session info
    return NextResponse.json({
      gameId: game.id,
      gameUrl: game.game_url,
      title: game.title,
      launchUrl: game.game_url, // In production, this might include session tokens
      message: 'Game launch initiated'
    })
  } catch (error) {
    console.error('Error launching game:', error)
    return NextResponse.json(
      { error: 'Failed to launch game' },
      { status: 500 }
    )
  }
}

