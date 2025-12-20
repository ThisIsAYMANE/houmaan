// Quick test to verify database connection
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'bcgame',
  user: 'bcgame',
  password: 'admin',
  connectionTimeoutMillis: 5000,
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ Connection successful!')
    console.log('Current time:', result.rows[0].current_time)
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1])
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('users', 'user_profiles', 'sessions', 'wallets')
      ORDER BY tablename
    `)
    console.log('\n✅ Required tables exist:')
    tablesResult.rows.forEach(row => console.log(`  - ${row.tablename}`))
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Error details:', error)
    await pool.end()
    process.exit(1)
  }
}

testConnection()
