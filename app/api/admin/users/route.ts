import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'
import { hashPassword } from '@/lib/auth'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().optional(),
  password: z.string().min(6),
  is_admin: z.boolean().optional().default(false),
  vip_level: z.number().int().min(0).max(10).optional().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const users = await query<{
      id: string
      email: string
      username: string | null
      is_active: number
      is_admin: number
      created_at: string
      vip_level: number
    }>(
      `SELECT id, email, username, is_active, is_admin, created_at, vip_level 
       FROM users 
       ORDER BY created_at DESC`
    )

    const formattedUsers = users.rows.map(user => ({
      ...user,
      is_active: Boolean(user.is_active),
      is_admin: Boolean(user.is_admin),
    }))

    return successResponse(formattedUsers)
  } catch (error) {
    console.error('Admin users error:', error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const validated = createUserSchema.safeParse(body)

    if (!validated.success) {
      return errorResponse(new Error('Invalid data'), 400)
    }

    const { email, username, password, is_admin, vip_level } = validated.data

    // Check if email already exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existing.rows.length > 0) {
      return errorResponse(new Error('Email already exists'), 409)
    }

    // Create user
    const userId = nanoid()
    const passwordHash = await hashPassword(password)

    await query(
      `INSERT INTO users (id, email, username, password_hash, is_admin, role, is_active, vip_level)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [userId, email, username || null, passwordHash, is_admin ? 1 : 0, is_admin ? 'admin' : 'user', vip_level || 0]
    )

    // Create profile
    await query(
      `INSERT INTO user_profiles (id, user_id, language, currency, theme)
       VALUES (?, ?, 'fr', 'MAD', 'dark')`,
      [nanoid(), userId]
    )

    // Create wallet
    await query(
      `INSERT INTO wallets (id, user_id, currency, balance)
       VALUES (?, ?, 'MAD', 0)`,
      [nanoid(), userId]
    )

    // Fetch created user
    const created = await query<{
      id: string
      email: string
      username: string | null
      is_active: number
      is_admin: number
      vip_level: number
    }>(
      'SELECT id, email, username, is_active, is_admin, vip_level FROM users WHERE id = ?',
      [userId]
    )

    return successResponse({
      ...created.rows[0],
      is_active: Boolean(created.rows[0].is_active),
      is_admin: Boolean(created.rows[0].is_admin),
    }, 201)
  } catch (error) {
    console.error('Create user error:', error)
    return errorResponse(error)
  }
}
