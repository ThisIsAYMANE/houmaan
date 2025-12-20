import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        slug,
        description,
        icon,
        "order",
        is_active
      FROM game_categories
      WHERE is_active = 1
      ORDER BY "order" ASC, name ASC
    `)

    return NextResponse.json({
      categories: result.rows
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}


