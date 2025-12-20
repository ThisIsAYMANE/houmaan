import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await query(`
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
        gc.slug as category_slug
      FROM games g
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE g.is_active = 1
      ORDER BY g.popularity DESC, g.player_count DESC
      LIMIT ?
    `, [limit])

    return NextResponse.json({
      games: result.rows
    })
  } catch (error) {
    console.error('Error fetching popular games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular games' },
      { status: 500 }
    )
  }
}

