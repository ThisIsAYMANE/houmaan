import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'
import { z } from 'zod'

const updateGameSchema = z.object({
  title: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
  category_id: z.string().optional(),
  provider_id: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const validated = updateGameSchema.safeParse(body)

    if (!validated.success) {
      return errorResponse(new Error('Invalid data'), 400)
    }

    const { id } = params
    const data = validated.data

    // Check if game exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM games WHERE id = ?',
      [id]
    )

    if (existing.rows.length === 0) {
      return errorResponse(new Error('Game not found'), 404)
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      values.push(data.title)
    }

    if (data.thumbnail_url !== undefined) {
      updates.push('thumbnail_url = ?')
      values.push(data.thumbnail_url)
    }

    if (data.is_active !== undefined) {
      updates.push('is_active = ?')
      values.push(data.is_active ? 1 : 0)
    }

    if (data.category_id !== undefined) {
      updates.push('category_id = ?')
      values.push(data.category_id)
    }

    if (data.provider_id !== undefined) {
      updates.push('provider_id = ?')
      values.push(data.provider_id)
    }

    if (updates.length === 0) {
      return errorResponse(new Error('No fields to update'), 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    await query(
      `UPDATE games SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Fetch updated game
    const updated = await query(
      `SELECT g.*, gc.name as category_name, gp.name as provider_name
       FROM games g
       LEFT JOIN game_categories gc ON g.category_id = gc.id
       LEFT JOIN game_providers gp ON g.provider_id = gp.id
       WHERE g.id = ?`,
      [id]
    )

    return successResponse(updated.rows[0])
  } catch (error) {
    console.error('Update game error:', error)
    return errorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = params

    // Check if game exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM games WHERE id = ?',
      [id]
    )

    if (existing.rows.length === 0) {
      return errorResponse(new Error('Game not found'), 404)
    }

    // Delete game
    await query('DELETE FROM games WHERE id = ?', [id])

    return successResponse({ message: 'Game deleted successfully' })
  } catch (error) {
    console.error('Delete game error:', error)
    return errorResponse(error)
  }
}










