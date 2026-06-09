import 'dotenv/config'
import { query, queryOne } from '../lib/db'

async function main() {
  const uid = 'normal_test_user_01'
  
  await query(
    'INSERT OR REPLACE INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)',
    [uid, 'normal_test@test.com', '$2a$10$placeholderhash123', 'NormalTestPlayer']
  )
  await query(
    'INSERT OR REPLACE INTO user_profiles (user_id, currency, language) VALUES (?, ?, ?)',
    [uid, 'EUR', 'en']
  )
  await query(
    'INSERT OR REPLACE INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)',
    [uid, 'EUR', 10000]
  )

  const user = await queryOne('SELECT id, email, username FROM users WHERE id = ?', [uid])
  const wallet = await queryOne('SELECT user_id, currency, balance FROM wallets WHERE user_id = ?', [uid])
  const profile = await queryOne('SELECT user_id, currency, language FROM user_profiles WHERE user_id = ?', [uid])

  console.log('User   :', JSON.stringify(user))
  console.log('Wallet :', JSON.stringify(wallet))
  console.log('Profile:', JSON.stringify(profile))
  console.log('\nNormal test user ready.')
}

main().catch(console.error)
