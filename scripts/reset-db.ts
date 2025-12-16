import 'dotenv/config'
import { db } from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function resetDatabase() {
  console.log('🗑️  Resetting database...')

  try {
    // Drop all tables (in reverse order of dependencies)
    const dropTables = [
      'schema_migrations',
      'notifications',
      'referrals',
      'user_medals',
      'vip_levels',
      'rollover_requirements',
      'bonuses',
      'withdrawals',
      'deposits',
      'transactions',
      'wallets',
      'user_bets',
      'recent_games',
      'user_favorites',
      'odds',
      'betting_markets',
      'matches',
      'leagues',
      'sports',
      'promotional_banners',
      'games',
      'game_providers',
      'game_categories',
      'sessions',
      'user_profiles',
      'users',
    ]

    for (const table of dropTables) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
        console.log(`✅ Dropped table ${table}`)
      } catch (error) {
        // Table might not exist, continue
      }
    }

    // Re-run migrations
    console.log('\n🔄 Re-running migrations...')
    const migrationFile = join(process.cwd(), 'sql', 'migrations', '001_initial_schema.sql')
    const sql = readFileSync(migrationFile, 'utf-8')
    await db.query(sql)

    // Create migrations record
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await db.query("INSERT INTO schema_migrations (version) VALUES ('001_initial_schema') ON CONFLICT DO NOTHING")

    console.log('🎉 Database reset completed!')
    console.log('💡 Run "npm run db:seed" to populate initial data')
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  } finally {
    await db.end()
  }
}

resetDatabase()

