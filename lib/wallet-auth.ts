import { ethers } from 'ethers'
import { query } from './db'
import { nanoid } from 'nanoid'
import { createSession } from './auth'

// Generate a nonce for wallet signature
export async function generateNonce(walletAddress: string): Promise<string> {
  const nonce = nanoid(32)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes expiry

  // Check if user exists with this wallet
  let existing: any
  try {
    existing = await query<{ id: string }>(
      'SELECT id FROM users WHERE wallet_address = ?',
      [walletAddress.toLowerCase()]
    )
  } catch (error: any) {
    // If wallet_address column doesn't exist, the migration hasn't run
    if (error.message && error.message.includes('no such column: wallet_address')) {
      console.error('Wallet authentication migration not applied. Please run: npx tsx scripts/migrate.ts')
      throw new Error('Wallet authentication not configured. Please contact support or run database migrations.')
    }
    throw error
  }

  if (existing.rows.length > 0) {
    // Update existing user's nonce
    await query(
      'UPDATE users SET nonce = ?, nonce_expires_at = ? WHERE wallet_address = ?',
      [nonce, expiresAt, walletAddress.toLowerCase()]
    )
  } else {
    // Create temporary user record for nonce storage
    // Note: email is NOT NULL in schema, so we'll use a placeholder email
    // This will be a wallet-only account (email can be updated later if user wants)
    const tempEmail = `wallet_${walletAddress.toLowerCase().substring(2, 12)}_${Date.now()}@wallet.temp`
    
    try {
      await query(
        `INSERT INTO users (id, email, wallet_address, nonce, nonce_expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [nanoid(), tempEmail, walletAddress.toLowerCase(), nonce, expiresAt]
      )
    } catch (error: any) {
      // If email already exists (very unlikely), try with a different temp email
      if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
        const tempEmail2 = `wallet_${walletAddress.toLowerCase().substring(2, 12)}_${Date.now()}_${Math.random().toString(36).substring(7)}@wallet.temp`
        await query(
          `INSERT INTO users (id, email, wallet_address, nonce, nonce_expires_at, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [nanoid(), tempEmail2, walletAddress.toLowerCase(), nonce, expiresAt]
        )
      } else if (error.message && error.message.includes('no such column: wallet_address')) {
        throw new Error('Wallet authentication not set up. Please run migrations: npx tsx scripts/migrate.ts')
      } else {
        console.error('Error creating wallet user:', error)
        throw error
      }
    }
  }

  return nonce
}

// Verify wallet signature
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  nonce: string
): Promise<{ userId: string; isNewUser: boolean } | null> {
  try {
    // Verify the signature
    const message = `Sign this message to authenticate with boz.Topol\n\nNonce: ${nonce}`
    const recoveredAddress = ethers.verifyMessage(message, signature)

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return null
    }

    // Check nonce validity
    const user = await query<{
      id: string
      nonce: string
      nonce_expires_at: string
      is_active: number
    }>(
      'SELECT id, nonce, nonce_expires_at, is_active FROM users WHERE wallet_address = ?',
      [walletAddress.toLowerCase()]
    )

    if (user.rows.length === 0) {
      return null
    }

    const userData = user.rows[0]

    // Check if nonce matches and hasn't expired
    if (userData.nonce !== nonce) {
      return null
    }

    const expiresAt = new Date(userData.nonce_expires_at)
    if (expiresAt < new Date()) {
      return null
    }

    // Check if user is active
    if (!userData.is_active) {
      return null
    }

    // Check if this is a new user (no email set)
    const fullUser = await query<{ email: string | null }>(
      'SELECT email FROM users WHERE id = ?',
      [userData.id]
    )

    const isNewUser = !fullUser.rows[0]?.email

    // Clear nonce after successful verification
    await query('UPDATE users SET nonce = NULL, nonce_expires_at = NULL WHERE id = ?', [
      userData.id,
    ])

    return {
      userId: userData.id,
      isNewUser,
    }
  } catch (error) {
    console.error('Error verifying wallet signature:', error)
    return null
  }
}

// Create or get user by wallet address
export async function getOrCreateWalletUser(
  walletAddress: string
): Promise<string> {
  const existing = await query<{ id: string }>(
    'SELECT id FROM users WHERE wallet_address = ?',
    [walletAddress.toLowerCase()]
  )

  if (existing.rows.length > 0) {
    return existing.rows[0].id
  }

  // Create new user with wallet
  const userId = nanoid()

  await query(
    `INSERT INTO users (id, wallet_address, is_active, vip_level)
     VALUES (?, ?, 1, 0)`,
    [userId, walletAddress.toLowerCase()]
  )

  // Get default currency from environment or use USD (most common for casinos)
  const defaultCurrency = process.env.CASINO_DEFAULT_CURRENCY || 'USD'
  
  // Create default profile
  await query(
    `INSERT INTO user_profiles (id, user_id, language, currency, theme)
     VALUES (?, ?, 'fr', ?, 'dark')`,
    [nanoid(), userId, defaultCurrency]
  )

  // Create default wallet
  await query(
    `INSERT INTO wallets (id, user_id, currency, balance)
     VALUES (?, ?, ?, 0)`,
    [nanoid(), userId, defaultCurrency]
  )

  return userId
}

// Get user by wallet address
export async function getUserByWalletAddress(walletAddress: string) {
  const result = await query<{
    id: string
    email: string | null
    username: string | null
    wallet_address: string
    avatar: string | null
    vip_level: number
    is_active: boolean
  }>(
    `SELECT id, email, username, wallet_address, avatar, vip_level, is_active
     FROM users WHERE wallet_address = ?`,
    [walletAddress.toLowerCase()]
  )

  return result.rows[0] || null
}

