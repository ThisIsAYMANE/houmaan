import bcrypt from 'bcryptjs'
import { query, transaction } from './db'
import { nanoid } from 'nanoid'

// Admin session management
export async function createAdminSession(adminId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const sessionToken = nanoid(32)
  const expires = new Date()
  expires.setDate(expires.getDate() + 1) // 1 day for admin sessions

  await query(
    `INSERT INTO admin_sessions (id, session_token, admin_id, expires, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [nanoid(), sessionToken, adminId, expires, ipAddress || null, userAgent || null]
  )

  return sessionToken
}

export async function getAdminSession(
  sessionToken: string
): Promise<{ adminId: string; expires: Date } | null> {
  const result = await query<{
    admin_id: string
    expires: string
  }>(
    `SELECT admin_id, expires FROM admin_sessions 
     WHERE session_token = $1 AND expires > CURRENT_TIMESTAMP`,
    [sessionToken]
  )

  if (result.rows.length === 0) {
    return null
  }

  return {
    adminId: result.rows[0].admin_id,
    expires: new Date(result.rows[0].expires),
  }
}

export async function deleteAdminSession(sessionToken: string): Promise<void> {
  await query(`DELETE FROM admin_sessions WHERE session_token = $1`, [sessionToken])
}

export async function deleteAdminSessions(adminId: string): Promise<void> {
  await query(`DELETE FROM admin_sessions WHERE admin_id = $1`, [adminId])
}

// Admin user management
export async function getAdminByEmail(email: string) {
  const result = await query<{
    id: string
    email: string
    username: string | null
    password_hash: string | null
    role: string
    is_admin: number
    is_active: number
  }>(
    `SELECT id, email, username, password_hash, role, is_admin, is_active 
     FROM users 
     WHERE email = $1 AND (is_admin = 1 OR role = 'admin')`,
    [email]
  )

  return result.rows[0] || null
}

export async function getAdminById(adminId: string) {
  const result = await query<{
    id: string
    email: string
    username: string | null
    role: string
    is_admin: number
    is_active: number
    created_at: string
  }>(
    `SELECT id, email, username, role, is_admin, is_active, created_at
     FROM users 
     WHERE id = $1 AND (is_admin = 1 OR role = 'admin')`,
    [adminId]
  )

  return result.rows[0] || null
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}





