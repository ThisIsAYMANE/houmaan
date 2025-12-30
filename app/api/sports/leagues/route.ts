import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sportId = searchParams.get('sport_id')

    let sql = `
      SELECT 
        l.id,
        l.name,
        l.slug,
        l.sport_id,
        l.country,
        l.logo_url,
        l.is_active,
        s.name as sport_name,
        s.slug as sport_slug
      FROM leagues l
      INNER JOIN sports s ON l.sport_id = s.id
      WHERE l.is_active = 1
    `

    const params: unknown[] = []

    if (sportId) {
      sql += ' AND l.sport_id = ?'
      params.push(sportId)
    }

    sql += ' ORDER BY l.name ASC'

    const result = await query(sql, params)

    return NextResponse.json({
      leagues: result.rows,
      total: result.rowCount
    })
  } catch (error) {
    console.error('Error fetching leagues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    )
  }
}





import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sportId = searchParams.get('sport_id')

    let sql = `
      SELECT 
        l.id,
        l.name,
        l.slug,
        l.sport_id,
        l.country,
        l.logo_url,
        l.is_active,
        s.name as sport_name,
        s.slug as sport_slug
      FROM leagues l
      INNER JOIN sports s ON l.sport_id = s.id
      WHERE l.is_active = 1
    `

    const params: unknown[] = []

    if (sportId) {
      sql += ' AND l.sport_id = ?'
      params.push(sportId)
    }

    sql += ' ORDER BY l.name ASC'

    const result = await query(sql, params)

    return NextResponse.json({
      leagues: result.rows,
      total: result.rowCount
    })
  } catch (error) {
    console.error('Error fetching leagues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    )
  }
}






