import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    let sql = `
      SELECT 
        ub.id,
        ub.user_id,
        ub.game_id,
        ub.amount,
        ub.payout,
        ub.currency,
        ub.placed_at,
        ub.settled_at,
        g.title as game_title,
        g.slug as game_slug,
        g.thumbnail_url as game_thumbnail,
        gp.name as provider_name,
        gc.slug as category_slug
      FROM user_bets ub
      INNER JOIN games g ON ub.game_id = g.id
      INNER JOIN game_providers gp ON g.provider_id = gp.id
      INNER JOIN game_categories gc ON g.category_id = gc.id
      WHERE ub.status = 'won'
        AND ub.payout > ub.amount
    `

    const params: unknown[] = []

    if (category && category !== 'all') {
      sql += ' AND gc.slug = ?'
      params.push(category)
    }

    sql += ' ORDER BY ub.settled_at DESC LIMIT ?'
    params.push(limit)

    const result = await query(sql, params)

    return NextResponse.json({
      wins: result.rows
    })
  } catch (error) {
    console.error('Error fetching recent wins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent wins' },
      { status: 500 }
    )
  }
}


