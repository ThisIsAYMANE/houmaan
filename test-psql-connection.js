require('dotenv').config()
const { Pool } = require('pg')

console.log('=== Testing PostgreSQL Connection ===\n')

// Try without password first (trust auth should work)
const config = {
  host: '127.0.0.1',
  port: 5432,
  database: 'bcgame',
  user: 'bcgame',
  // No password - trust authentication should allow this
}

console.log('Connection config:')
console.log('  Host:', config.host)
console.log('  Port:', config.port)
console.log('  Database:', config.database)
console.log('  User:', config.user)
console.log('  Password:', config.password ? '***' : 'NOT SET')
console.log('')

const pool = new Pool(config)

pool.query('SELECT current_user, current_database(), version()')
  .then(result => {
    console.log('✅ SUCCESS! Connection works!')
    console.log('Result:', result.rows[0])
    pool.end()
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ FAILED!')
    console.error('Error code:', err.code)
    console.error('Error message:', err.message)
    console.error('\nFull error:', err)
    pool.end()
    process.exit(1)
  })

