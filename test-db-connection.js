require('dotenv').config()
const { Pool } = require('pg')

console.log('Testing database connection...')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET')

// Test with connection string
const pool1 = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Test with individual params
const url = process.env.DATABASE_URL.replace(/^postgresql:\/\//, '')
const [auth, hostPortDb] = url.split('@')
const [user, password] = auth.split(':')
const [hostPort, dbPath] = hostPortDb.split('/')
const [host, port] = hostPort.split(':')
const database = dbPath?.split('?')[0] || 'bcgame'

console.log('Parsed:', { host, port, database, user, password: password ? '***' : 'MISSING' })

const pool2 = new Pool({
  host: host || '127.0.0.1',
  port: parseInt(port || '5432'),
  database: database,
  user: user || 'bcgame',
  password: password || 'bcgame123',
})

async function test() {
  try {
    console.log('\n1. Testing with connection string...')
    const result1 = await pool1.query('SELECT 1 as test')
    console.log('✅ Connection string works!', result1.rows[0])
    await pool1.end()
  } catch (err) {
    console.log('❌ Connection string failed:', err.message)
    await pool1.end()
  }

  try {
    console.log('\n2. Testing with individual params...')
    const result2 = await pool2.query('SELECT 1 as test')
    console.log('✅ Individual params work!', result2.rows[0])
    await pool2.end()
  } catch (err) {
    console.log('❌ Individual params failed:', err.message)
    await pool2.end()
  }
}

test()

