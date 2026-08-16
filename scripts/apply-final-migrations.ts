import { exec, query } from '../lib/db'
import { runBonusMigrations } from '../lib/bonus-db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function run() {
  console.log('Running bonus migrations...')
  runBonusMigrations()
  console.log('Bonus migrations applied.')

  console.log('Running platform_settings migration...')
  try {
    const sql = readFileSync(join(process.cwd(), 'sql', 'migrations', '014_platform_settings.sqlite.sql'), 'utf-8')
    exec(sql)
    console.log('platform_settings migration applied.')
    
    // Create admin_sessions table if it doesn't exist just in case 002 failed earlier but wasn't fully applied
    exec(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
    `)
  } catch (error) {
    console.error('Error applying migration:', error)
  }

  console.log('All done.')
}

run()
