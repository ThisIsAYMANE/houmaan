const Database = require('better-sqlite3')
const path = require('path')
const db = new Database(path.join(process.cwd(), 'data', 'bcgame.db'))

// Show current state
const users = db.prepare(`
  SELECT u.id, u.email, up.currency as pc, w.balance, w.currency as wc
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN wallets w ON u.id = w.user_id
  WHERE u.is_admin IS NULL OR u.is_admin = 0
`).all()

console.log('Current regular users:')
users.forEach(r => console.log(` - ${r.email} | id: ${r.id} | profile: ${r.pc} | wallet: ${r.balance} ${r.wc}`))

// Top up ALL EUR wallets to 10000 for self-validation tests
const w = db.prepare("UPDATE wallets SET balance = 10000 WHERE currency = 'EUR'").run()
console.log(`\nSet ${w.changes} wallet(s) to 10000 EUR`)

const after = db.prepare(`
  SELECT u.email, w.balance, w.currency
  FROM users u
  JOIN wallets w ON u.id = w.user_id
`).all()

console.log('\nFinal wallet balances:')
after.forEach(r => console.log(` - ${r.email}: ${r.balance} ${r.currency}`))

db.close()
console.log('\nDone! Now launch a game and immediately run self-validate again.')
