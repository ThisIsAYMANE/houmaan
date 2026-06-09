/**
 * Reset wallet balance for self-validation testing.
 * Sets all EUR wallets to 100,000 EUR — enough for Slotegrator's largest test bets.
 * 
 * Usage: node scripts/reset-for-validate.js
 */
const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(process.cwd(), 'data', 'bcgame.db'))

console.log('Resetting wallets for self-validation...\n')

// Set ALL EUR wallets to 100,000
const w = db.prepare("UPDATE wallets SET balance = 100000 WHERE currency = 'EUR'").run()
console.log(`✅ Set ${w.changes} EUR wallet(s) to 100,000 EUR`)

// Show current state
const users = db.prepare(`
  SELECT u.email, w.balance, w.currency
  FROM users u
  JOIN wallets w ON u.id = w.user_id
  ORDER BY u.email
`).all()

console.log('\nWallet balances:')
users.forEach(r => console.log(`  - ${r.email}: ${r.balance} ${r.currency}`))

db.close()

console.log('\n⚠️  IMPORTANT: After running this script, you MUST:')
console.log('   1. Open the app in your browser')
console.log('   2. Launch a game (creates a fresh session)')
console.log('   3. Then immediately run: Invoke-RestMethod -Uri "http://localhost:3000/api/casino/self-validate" -Method Post')
console.log('\n   If you run self-validate WITHOUT launching a game first,')
console.log('   Slotegrator will reuse the old session and the test will fail.')
