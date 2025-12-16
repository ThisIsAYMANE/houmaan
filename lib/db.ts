import { Pool } from 'pg'

// Create a singleton pool instance
const globalForDb = globalThis as unknown as {
  db: Pool | undefined
}

// Use connection string directly (like the working project)
// This avoids any parsing issues and matches PostgreSQL's expected format
function getDbConfig() {
  // Prefer DATABASE_URL if set (standard approach)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  }
  
  // Fallback to individual env vars
  return {
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'bcgame',
    user: process.env.POSTGRES_USER || 'bcgame',
    password: process.env.POSTGRES_PASSWORD || 'bcgame123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

export const db =
  globalForDb.db ?? new Pool(getDbConfig())

if (process.env.NODE_ENV !== 'production') globalForDb.db = db

// Helper function to execute queries
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now()
  try {
    const result = await db.query(text, params)
    const duration = Date.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount })
    }

    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0
    }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
