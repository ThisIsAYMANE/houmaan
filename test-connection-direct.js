require('dotenv').config()
const { Pool } = require('pg')

console.log('Environment variables:')
console.log('POSTGRES_USER:', process.env.POSTGRES_USER)
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***' : 'NOT SET')
console.log('POSTGRES_DB:', process.env.POSTGRES_DB)
console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT)

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'bcgame',
  user: process.env.POSTGRES_USER || 'bcgame',
  password: process.env.POSTGRES_PASSWORD || 'bcgame123',
})

pool.query('SELECT 1 as test, current_user, current_database()')
  .then(result => {
    console.log('✅ Connection successful!', result.rows[0])
    pool.end()
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message)
    console.error('Error code:', err.code)
    pool.end()
  })












