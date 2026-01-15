import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  is_active: z.boolean().optional(),
  is_admin: z.boolean().optional(),
  password: z.string().min(6).optional(),
  vip_level: z.number().int().min(0).max(10).optional(),
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
    const validated = updateUserSchema.safeParse(body)

    if (!validated.success) {
      return errorResponse(new Error('Invalid data'), 400)
    }

    const { id } = params
    const data = validated.data

    // Check if user exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    )

    if (existing.rows.length === 0) {
      return errorResponse(new Error('User not found'), 404)
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (data.email !== undefined) {
      updates.push('email = ?')
      values.push(data.email)
    }

    if (data.username !== undefined) {
      updates.push('username = ?')
      values.push(data.username)
    }

    if (data.is_active !== undefined) {
      updates.push('is_active = ?')
      values.push(data.is_active ? 1 : 0)
    }

    if (data.is_admin !== undefined) {
      updates.push('is_admin = ?')
      updates.push('role = ?')
      values.push(data.is_admin ? 1 : 0)
      values.push(data.is_admin ? 'admin' : 'user')
    }

    if (data.password !== undefined) {
      const passwordHash = await hashPassword(data.password)
      updates.push('password_hash = ?')
      values.push(passwordHash)
    }

    if (data.vip_level !== undefined) {
      updates.push('vip_level = ?')
      values.push(data.vip_level)
    }

    if (updates.length === 0) {
      return errorResponse(new Error('No fields to update'), 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Fetch updated user
    const updated = await query<{
      id: string
      email: string
      username: string | null
      is_active: number
      is_admin: number
      vip_level: number
    }>(
      'SELECT id, email, username, is_active, is_admin, vip_level FROM users WHERE id = ?',
      [id]
    )

    return successResponse({
      ...updated.rows[0],
      is_active: Boolean(updated.rows[0].is_active),
      is_admin: Boolean(updated.rows[0].is_admin),
    })
  } catch (error) {
    console.error('Update user error:', error)
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

    // Check if user exists
    const existing = await query<{ id: string; is_admin: number }>(
      'SELECT id, is_admin FROM users WHERE id = ?',
      [id]
    )

    if (existing.rows.length === 0) {
      return errorResponse(new Error('User not found'), 404)
    }

    // Prevent deleting admin users
    if (existing.rows[0].is_admin) {
      return errorResponse(new Error('Cannot delete admin user'), 403)
    }

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = ?', [id])

    return successResponse({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return errorResponse(error)
  }
}










