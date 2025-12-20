import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { db, query, exec } from '../lib/db'

async function runMigrations() {
  console.log('🔄 Running database migrations...')

  try {
    // Create migrations table to track applied migrations
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get all migration files (prioritize SQLite version, skip PostgreSQL ones)
    const migrationsDir = join(process.cwd(), 'sql', 'migrations')
    const allFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
    
    // Prioritize SQLite files, skip PostgreSQL ones if SQLite version exists
    const sqliteFiles = allFiles.filter(f => f.includes('.sqlite.sql'))
    const pgFiles = allFiles.filter(f => !f.includes('.sqlite.sql'))
    
    // Use SQLite files if they exist, otherwise fall back to regular SQL files
    const files = sqliteFiles.length > 0 
      ? sqliteFiles 
      : pgFiles.filter(f => {
          // Skip if there's a corresponding SQLite file
          const sqliteVersion = f.replace('.sql', '.sqlite.sql')
          return !sqliteFiles.includes(sqliteVersion)
        })

    // Get applied migrations
    const applied = await query('SELECT version FROM schema_migrations')
    const appliedVersions = new Set(applied.rows.map((r: any) => r.version))

    // Run pending migrations
    for (const file of files) {
      const version = file.replace('.sqlite.sql', '').replace('.sql', '')
      
      if (appliedVersions.has(version)) {
        console.log(`⏭️  Skipping ${file} (already applied)`)
        continue
      }

      console.log(`📝 Applying ${file}...`)
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')
      
      // Execute migration (SQLite can handle multiple statements with exec)
      exec(sql)
      
      // Record migration
      await query('INSERT INTO schema_migrations (version) VALUES (?)', [version])
      
      console.log(`✅ Applied ${file}`)
    }

    console.log('🎉 All migrations completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    // SQLite doesn't need explicit closing, but we can close it
    // db.close()
  }
}

runMigrations()
