import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

// Get session from cookie (simplified - in production use proper auth)
async function getUserId(request: NextRequest): Promise<string | null> {
  // For now, we'll use a mock user ID or get from session
  // In production, extract from session cookie
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
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const gameId = params.id

    // Check if game exists
    const game = await queryOne<{ id: string }>(
      'SELECT id FROM games WHERE id = ? AND is_active = 1',
      [gameId]
    )

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM user_favorites WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )

    if (existing) {
      return NextResponse.json(
        { message: 'Game already in favorites', isFavorite: true }
      )
    }

    // Add to favorites
    await query(
      'INSERT INTO user_favorites (id, user_id, game_id) VALUES (?, ?, ?)',
      [nanoid(), userId, gameId]
    )

    return NextResponse.json({
      message: 'Game added to favorites',
      isFavorite: true
    })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const gameId = params.id

    // Remove from favorites
    const result = await query(
      'DELETE FROM user_favorites WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Game removed from favorites',
      isFavorite: false
    })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}


