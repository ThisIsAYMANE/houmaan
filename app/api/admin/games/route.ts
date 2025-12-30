import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const createGameSchema = z.object({
  title: z.string().min(1),
  thumbnail_url: z.string().url().optional(),
  category_id: z.string(),
  provider_id: z.string(),
  is_active: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const validated = createGameSchema.safeParse(body)

    if (!validated.success) {
      return errorResponse(new Error('Invalid data'), 400)
    }

    const { title, thumbnail_url, category_id, provider_id, is_active } = validated.data

    // Check if category and provider exist
    const category = await query<{ id: string }>(
      'SELECT id FROM game_categories WHERE id = ?',
      [category_id]
    )

    if (category.rows.length === 0) {
      return errorResponse(new Error('Category not found'), 404)
    }

    const provider = await query<{ id: string }>(
      'SELECT id FROM game_providers WHERE id = ?',
      [provider_id]
    )

    if (provider.rows.length === 0) {
      return errorResponse(new Error('Provider not found'), 404)
    }

    // Create game
    const gameId = nanoid()

    await query(
      `INSERT INTO games (id, title, thumbnail_url, category_id, provider_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [gameId, title, thumbnail_url || null, category_id, provider_id, is_active ? 1 : 0]
    )

    // Fetch created game
    const created = await query(
      `SELECT g.*, gc.name as category_name, gp.name as provider_name
       FROM games g
       LEFT JOIN game_categories gc ON g.category_id = gc.id
       LEFT JOIN game_providers gp ON g.provider_id = gp.id
       WHERE g.id = ?`,
      [gameId]
    )

    return successResponse(created.rows[0], 201)
  } catch (error) {
    console.error('Create game error:', error)
    return errorResponse(error)
  }
}


