import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const provider = searchParams.get('provider')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let sql = `
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
    `

    const params: unknown[] = []

    if (category) {
      sql += ' AND gc.slug = ?'
      params.push(category)
    }

    if (provider) {
      sql += ' AND gp.slug = ?'
      params.push(provider)
    }

    if (featured === 'true') {
      sql += ' AND g.is_featured = 1'
    }

    sql += ' ORDER BY g.popularity DESC, g.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const result = await query(sql, params)

    return NextResponse.json({
      games: result.rows,
      total: result.rowCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

