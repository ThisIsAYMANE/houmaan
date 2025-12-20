import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 3) {
      return NextResponse.json({
        games: [],
        total: 0,
        message: 'Search query must be at least 3 characters'
      })
    }

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
        gc.slug as category_slug
      FROM games g
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE g.is_active = 1
        AND (g.title LIKE ? OR g.description LIKE ?)
      ORDER BY 
        CASE 
          WHEN g.title LIKE ? THEN 1
          WHEN g.title LIKE ? THEN 2
          ELSE 3
        END,
        g.popularity DESC
      LIMIT 50
    `

    const searchTerm = `%${q}%`
    const exactMatch = `${q}%`
    const result = await query(sql, [searchTerm, searchTerm, exactMatch, searchTerm])

    return NextResponse.json({
      games: result.rows,
      total: result.rowCount,
      query: q
    })
  } catch (error) {
    console.error('Error searching games:', error)
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}

