import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { db } from '../lib/db'

async function runMigrations() {
  console.log('🔄 Running database migrations...')

  try {
    // Create migrations table to track applied migrations
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Get all migration files
    const migrationsDir = join(process.cwd(), 'sql', 'migrations')
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    // Get applied migrations
    const applied = await db.query('SELECT version FROM schema_migrations')
    const appliedVersions = new Set(applied.rows.map((r: any) => r.version))

    // Run pending migrations
    for (const file of files) {
      const version = file.replace('.sql', '')
      
      if (appliedVersions.has(version)) {
        console.log(`⏭️  Skipping ${file} (already applied)`)
        continue
      }

      console.log(`📝 Applying ${file}...`)
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')
      
      // Execute migration
      await db.query(sql)
      
      // Record migration
      await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version])
      
      console.log(`✅ Applied ${file}`)
    }

    console.log('🎉 All migrations completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await db.end()
  }
}

runMigrations()

