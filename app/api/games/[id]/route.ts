import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id

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
        g.category_id,
        g.provider_id,
        gp.name as provider_name,
        gp.slug as provider_slug,
        gp.logo_url as provider_logo,
        gc.name as category_name,
        gc.slug as category_slug
      FROM games g
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE g.id = ?
    `

    const game = await queryOne(sql, [gameId])

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ game })
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}



