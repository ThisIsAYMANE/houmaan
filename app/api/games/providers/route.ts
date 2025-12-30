import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        slug
      FROM game_providers
      WHERE is_active = 1
      ORDER BY name ASC
    `)

    return successResponse(result.rows)
  } catch (error) {
    console.error('Error fetching providers:', error)
    return errorResponse(error)
  }
}




