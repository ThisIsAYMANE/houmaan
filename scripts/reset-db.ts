import 'dotenv/config'
import { db, query, exec } from '../lib/db'
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
        exec(`DROP TABLE IF EXISTS ${table}`)
        console.log(`✅ Dropped table ${table}`)
      } catch (error) {
        // Table might not exist, continue
      }
    }

    // Re-run migrations
    console.log('\n🔄 Re-running migrations...')
    const migrationFile = join(process.cwd(), 'sql', 'migrations', '001_initial_schema.sqlite.sql')
    const sql = readFileSync(migrationFile, 'utf-8')
    exec(sql)

    // Create migrations record
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await query("INSERT INTO schema_migrations (version) VALUES (?) ON CONFLICT DO NOTHING", ['001_initial_schema'])

    console.log('🎉 Database reset completed!')
    console.log('💡 Run "npm run db:seed" to populate initial data')
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

resetDatabase()
