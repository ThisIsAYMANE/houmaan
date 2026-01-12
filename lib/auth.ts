import bcrypt from 'bcryptjs'
import { query, transaction } from './db'
import { nanoid } from 'nanoid'

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Session management
export async function createSession(userId: string): Promise<string> {
  const sessionToken = nanoid(32)
  const expires = new Date()
  expires.setDate(expires.getDate() + 30) // 30 days

  await query(
    `INSERT INTO sessions (id, session_token, user_id, expires)
     VALUES ($1, $2, $3, $4)`,
    [nanoid(), sessionToken, userId, expires]
  )

  return sessionToken
}

export async function getSession(
  sessionToken: string
): Promise<{ userId: string; expires: Date } | null> {
  const result = await query<{
    user_id: string
    expires: string
  }>(
    `SELECT user_id, expires FROM sessions 
     WHERE session_token = $1 AND expires > CURRENT_TIMESTAMP`,
    [sessionToken]
  )

  if (result.rows.length === 0) {
    return null
  }

  return {
    userId: result.rows[0].user_id,
    expires: new Date(result.rows[0].expires), // Convert string back to Date
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE session_token = $1`, [sessionToken])
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId])
}

// User management
export async function getUserByEmail(email: string) {
  const result = await query<{
    id: string
    email: string
    username: string | null
    password_hash: string | null
    avatar: string | null
    vip_level: number
    is_active: boolean
  }>(`SELECT id, email, username, password_hash, avatar, vip_level, is_active 
      FROM users WHERE email = $1`,
    [email]
  )

  return result.rows[0] || null
}

export async function getUserById(userId: string) {
  const result = await query<{
    id: string
    email: string
    username: string | null
    avatar: string | null
    vip_level: number
    is_active: boolean
    created_at: Date
  }>(`SELECT id, email, username, avatar, vip_level, is_active, created_at
      FROM users WHERE id = $1`,
    [userId]
  )

  return result.rows[0] || null
}

export async function createUser(data: {
  email: string
  password: string
  username?: string
  phone?: string
}) {
  const userId = nanoid()
  const passwordHash = await hashPassword(data.password)

  try {
    // Use transaction to ensure atomicity
    await transaction(async (client) => {
      // Insert user
      await client.query(
        `INSERT INTO users (id, email, username, password_hash, phone)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, data.email, data.username || null, passwordHash, data.phone || null]
      )

      // Get default currency from environment or use USD (most common for casinos)
      const defaultCurrency = process.env.CASINO_DEFAULT_CURRENCY || 'USD'
      
      // Create default profile
      await client.query(
        `INSERT INTO user_profiles (id, user_id, language, currency, theme)
         VALUES ($1, $2, 'fr', $3, 'dark')`,
        [nanoid(), userId, defaultCurrency]
      )

      // Create default wallet
      await client.query(
        `INSERT INTO wallets (id, user_id, currency, balance)
         VALUES ($1, $2, $3, 0)`,
        [nanoid(), userId, defaultCurrency]
      )
    })

    return userId
  } catch (error) {
    console.error('Error creating user:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
    }
    throw error
  }
}

export async function getUserProfile(userId: string) {
  const result = await query<{
    id: string
    user_id: string
    first_name: string | null
    last_name: string | null
    language: string
    currency: string
    theme: string
    total_winnings: number
    total_bets: number
    total_wagers: number
  }>(
    `SELECT id, user_id, first_name, last_name, language, currency, theme,
            total_winnings, total_bets, total_wagers
     FROM user_profiles WHERE user_id = $1`,
    [userId]
  )

  return result.rows[0] || null
}

