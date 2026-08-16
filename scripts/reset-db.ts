import 'dotenv/config'
import { db, query, exec } from '../lib/db'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

async function resetDatabase() {
  console.log('🗑️  Resetting database...')

  try {
    // Drop ALL tables in reverse dependency order (including crypto payment tables)
    const dropTables = [
      // Crypto payment monitoring
      'usdt_payment_monitoring',
      'eth_payment_monitoring',
      // Crypto address tables
      'usdt_addresses',
      'eth_addresses',
      'bitcoin_addresses',
      // App tables
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

    // Re-run ALL migrations in alphabetical order
    console.log('\n🔄 Re-running migrations...')
    const migrationsDir = join(process.cwd(), 'sql', 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sqlite.sql'))
      .sort()

    for (const file of migrationFiles) {
      try {
        const sql = readFileSync(join(migrationsDir, file), 'utf-8')
        exec(sql)
        console.log(`✅ Applied migration: ${file}`)
      } catch (error: any) {
        console.warn(`⚠️  Skipped (already applied or safe to ignore): ${file} — ${error.message}`)
      }
    }

    // Create migrations record
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await query("INSERT INTO schema_migrations (version) VALUES (?) ON CONFLICT DO NOTHING", ['001_initial_schema'])

    console.log('\n🎉 Database reset completed!')
    console.log('💡 Run "npm run db:seed" to populate initial data')
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

resetDatabase()
