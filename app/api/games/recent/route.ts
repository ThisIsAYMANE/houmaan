import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const sql = `
      SELECT 
        g.id,
        g.title,
        g.slug,
        g.description,
        g.thumbnail_url,
        g.game_url,
        g.is_active,
        g.is_featured,
        g.is_new,
        g.is_exclusive,
        g.is_original,
        g.has_buy_in,
        g.is_burst,
        g.multiplier,
        g.player_count,
        g.popularity,
        g.created_at,
        gp.name as provider_name,
        gp.slug as provider_slug,
        gp.logo_url as provider_logo,
        gc.name as category_name,
        gc.slug as category_slug,
        rg.last_played
      FROM recent_games rg
      INNER JOIN games g ON rg.game_id = g.id
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE rg.user_id = ? AND g.is_active = 1
      ORDER BY rg.last_played DESC
      LIMIT ? OFFSET ?
    `

    const result = await query(sql, [userId, limit, offset])

    return NextResponse.json({
      games: result.rows,
      total: result.rowCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching recent games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent games' },
      { status: 500 }
    )
  }
}





import { query, queryOne } from '@/lib/db'

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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const sql = `
      SELECT 
        g.id,
        g.title,
        g.slug,
        g.description,
        g.thumbnail_url,
        g.game_url,
        g.is_active,
        g.is_featured,
        g.is_new,
        g.is_exclusive,
        g.is_original,
        g.has_buy_in,
        g.is_burst,
        g.multiplier,
        g.player_count,
        g.popularity,
        g.created_at,
        gp.name as provider_name,
        gp.slug as provider_slug,
        gp.logo_url as provider_logo,
        gc.name as category_name,
        gc.slug as category_slug,
        rg.last_played
      FROM recent_games rg
      INNER JOIN games g ON rg.game_id = g.id
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE rg.user_id = ? AND g.is_active = 1
      ORDER BY rg.last_played DESC
      LIMIT ? OFFSET ?
    `

    const result = await query(sql, [userId, limit, offset])

    return NextResponse.json({
      games: result.rows,
      total: result.rowCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching recent games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent games' },
      { status: 500 }
    )
  }
}







