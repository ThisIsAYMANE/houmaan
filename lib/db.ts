import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Create a singleton database instance
const globalForDb = globalThis as unknown as {
  db: Database.Database | undefined
}

function getDbPath() {
  // Use environment variable or default to local file
  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'bcgame.db')
  
  // Ensure the directory exists
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  return dbPath
}

function createDatabase(): Database.Database {
  const dbPath = getDbPath()
  console.log('SQLite database path:', dbPath)
  
  const db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')
  
  return db
}

export const db = globalForDb.db ?? createDatabase()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db

// Sanitize parameters for SQLite binding
// SQLite only accepts: numbers, strings, bigints, buffers, and null
function sanitizeParams(params: unknown[]): unknown[] {
  return params.map(param => {
    // Convert undefined to null
    if (param === undefined) {
      return null
    }
    // Convert Date objects to ISO strings
    if (param instanceof Date) {
      return param.toISOString()
    }
    // Keep other valid types as-is
    return param
  })
}

// Helper function to execute queries (async wrapper for compatibility)
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now()
  try {
    // SQLite uses ? placeholders, but we'll support both ? and $1, $2, etc.
    let sql = text.trim()
    let finalParams = params || []
    
    // Convert PostgreSQL-style placeholders ($1, $2) to SQLite placeholders (?)
    if (params && params.length > 0 && sql.includes('$')) {
      sql = sql.replace(/\$(\d+)/g, () => '?')
      finalParams = params
    }
    
    // Sanitize parameters for SQLite (convert Date to string, undefined to null)
    finalParams = sanitizeParams(finalParams)
    
    const stmt = db.prepare(sql)
    
    // Check if this is a SELECT query (returns data) or DDL/DML (doesn't return data)
    const isSelect = /^\s*SELECT/i.test(sql)
    
    if (isSelect) {
      // SELECT queries return data
      const result = stmt.all(...finalParams) as T[]
      const duration = Date.now() - start

      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text: sql, duration, rows: result.length })
      }

      return {
        rows: result,
        rowCount: result.length
      }
    } else {
      // DDL/DML queries (CREATE, INSERT, UPDATE, DELETE, etc.) don't return data
      const result = stmt.run(...finalParams)
      const duration = Date.now() - start

      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text: sql, duration, changes: result.changes })
      }

      return {
        rows: [] as T[],
        rowCount: result.changes || 0
      }
    }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Helper function for getting a single row
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params)
  return result.rows[0] || null
}

// Transaction context interface
interface TransactionContext {
  query: <T = unknown>(text: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>
}

// Helper function for transactions
// Note: SQLite transactions are synchronous, but we wrap them to support async callbacks
export async function transaction<T>(
  callback: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  // For SQLite, we'll use a simple approach: execute all queries in a transaction
  // Since better-sqlite3 transactions are synchronous, we need to collect queries
  return new Promise(async (resolve, reject) => {
    try {
      // Start transaction
      db.exec('BEGIN TRANSACTION')
      
      // Create a transaction context that mimics the pg client interface
      const txContext: TransactionContext = {
        query: async <TResult = unknown>(text: string, params?: unknown[]) => {
          let sql = text.trim()
          let finalParams = params || []
          
          // Convert PostgreSQL-style placeholders to SQLite placeholders
          if (params && params.length > 0 && sql.includes('$')) {
            sql = sql.replace(/\$(\d+)/g, () => '?')
            finalParams = params
          }
          
          // Sanitize parameters for SQLite (convert Date to string, undefined to null)
          finalParams = sanitizeParams(finalParams)
          
          const stmt = db.prepare(sql)
          const isSelect = /^\s*SELECT/i.test(sql)
          
          if (isSelect) {
            const result = stmt.all(...finalParams) as TResult[]
            return {
              rows: result,
              rowCount: result.length
            }
          } else {
            const result = stmt.run(...finalParams)
            return {
              rows: [] as TResult[],
              rowCount: result.changes || 0
            }
          }
        }
      }
      
      try {
        const result = await callback(txContext)
        db.exec('COMMIT')
        resolve(result)
      } catch (error) {
        db.exec('ROLLBACK')
        reject(error)
      }
    } catch (error) {
      try {
        db.exec('ROLLBACK')
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError)
      }
      reject(error)
    }
  })
}

// Helper for executing raw SQL (useful for migrations)
export function exec(sql: string): void {
  db.exec(sql)
}

// Close database connection (useful for cleanup)
export function close(): void {
  db.close()
}
