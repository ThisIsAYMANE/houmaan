import { query } from '../lib/db'
import { hashPassword } from '../lib/auth'
import { nanoid } from 'nanoid'

async function createAdmin() {
  const email = process.argv[2] || 'admin@shartbandee.com'
  const password = process.argv[3] || 'admin123'
  const username = process.argv[4] || 'admin'

  try {
    // Check if admin already exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      console.log('Admin user already exists. Updating...')
      const passwordHash = await hashPassword(password)
      await query(
        `UPDATE users 
         SET password_hash = $1, is_admin = 1, role = 'admin', is_active = 1 
         WHERE email = $2`,
        [passwordHash, email]
      )
      console.log('✅ Admin user updated successfully!')
      console.log(`Email: ${email}`)
      console.log(`Password: ${password}`)
      return
    }

    // Create new admin user
    const userId = nanoid()
    const passwordHash = await hashPassword(password)

    await query(
      `INSERT INTO users (id, email, username, password_hash, is_admin, role, is_active)
       VALUES ($1, $2, $3, $4, 1, 'admin', 1)`,
      [userId, email, username, passwordHash]
    )

    // Create profile
    await query(
      `INSERT INTO user_profiles (id, user_id, language, currency, theme)
       VALUES ($1, $2, 'fr', 'MAD', 'dark')`,
      [nanoid(), userId]
    )

    // Create wallet
    await query(
      `INSERT INTO wallets (id, user_id, currency, balance)
       VALUES ($1, $2, 'MAD', 0)`,
      [nanoid(), userId]
    )

    console.log('✅ Admin user created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Username: ${username}`)
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
}

createAdmin()











