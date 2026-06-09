const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(process.cwd(), 'data', 'bcgame.db'))

// Update profiles: USD -> EUR
const p = db.prepare("UPDATE user_profiles SET currency = 'EUR' WHERE currency = 'USD'").run()
console.log('Updated profiles (USD->EUR):', p.changes)

// Update wallets: USD -> EUR
const w = db.prepare("UPDATE wallets SET currency = 'EUR' WHERE currency = 'USD'").run()
console.log('Updated wallets  (USD->EUR):', w.changes)

// Show all non-admin users
const users = db.prepare(`
  SELECT u.email, up.currency AS pc, w.currency AS wc, w.balance
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN wallets w ON u.id = w.user_id
  WHERE u.is_admin IS NULL OR u.is_admin = 0
`).all()

if (users.length === 0) {
  console.log('No regular users found.')
} else {
  console.log('\nRegular users:')
  users.forEach(r => {
    console.log(` - ${r.email} | profile currency: ${r.pc} | wallet currency: ${r.wc} | balance: ${r.balance}`)
  })
}

db.close()
console.log('\nDone! Restart the dev server for .env changes to take effect.')
