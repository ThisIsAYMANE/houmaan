/**
 * Database Utility Tests
 */
import { query, queryOne, transaction } from '@/lib/db'

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: jest.fn(),
    exec: jest.fn(),
    pragma: jest.fn(),
    close: jest.fn(),
  }
  
  return jest.fn(() => mockDb)
})

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('query', () => {
    it('should execute SELECT queries and return rows', async () => {
      const mockRows = [{ id: '1', name: 'Test' }]
      const mockStmt = {
        all: jest.fn().mockReturnValue(mockRows),
      }
      
      // Mock the db instance
      const { db } = require('@/lib/db')
      db.prepare.mockReturnValue(mockStmt)

      const result = await query('SELECT * FROM users WHERE id = ?', ['1'])

      expect(result.rows).toEqual(mockRows)
      expect(result.rowCount).toBe(1)
    })

    it('should execute UPDATE queries and return rowCount', async () => {
      const mockStmt = {
        run: jest.fn().mockReturnValue({ changes: 1 }),
      }
      
      const { db } = require('@/lib/db')
      db.prepare.mockReturnValue(mockStmt)

      const result = await query('UPDATE users SET name = ? WHERE id = ?', ['New Name', '1'])

      expect(result.rows).toEqual([])
      expect(result.rowCount).toBe(1)
    })

    it('should convert PostgreSQL placeholders to SQLite placeholders', async () => {
      const mockStmt = {
        all: jest.fn().mockReturnValue([]),
      }
      
      const { db } = require('@/lib/db')
      db.prepare.mockReturnValue(mockStmt)

      await query('SELECT * FROM users WHERE id = $1 AND email = $2', ['1', 'test@test.com'])

      expect(db.prepare).toHaveBeenCalledWith(expect.stringMatching(/\?/))
    })

    it('should handle errors gracefully', async () => {
      const { db } = require('@/lib/db')
      db.prepare.mockImplementation(() => {
        throw new Error('Database error')
      })

      await expect(query('SELECT * FROM users')).rejects.toThrow('Database error')
    })
  })

  describe('queryOne', () => {
    it('should return first row or null', async () => {
      const mockRows = [{ id: '1', name: 'Test' }]
      const mockStmt = {
        all: jest.fn().mockReturnValue(mockRows),
      }
      
      const { db } = require('@/lib/db')
      db.prepare.mockReturnValue(mockStmt)

      const result = await queryOne('SELECT * FROM users WHERE id = ?', ['1'])

      expect(result).toEqual(mockRows[0])
    })

    it('should return null when no rows found', async () => {
      const mockStmt = {
        all: jest.fn().mockReturnValue([]),
      }
      
      const { db } = require('@/lib/db')
      db.prepare.mockReturnValue(mockStmt)

      const result = await queryOne('SELECT * FROM users WHERE id = ?', ['999'])

      expect(result).toBeNull()
    })
  })

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const { db } = require('@/lib/db')
      const mockStmt = {
        all: jest.fn().mockReturnValue([]),
        run: jest.fn().mockReturnValue({ changes: 1 }),
      }
      db.prepare.mockReturnValue(mockStmt)

      const result = await transaction(async (tx) => {
        await tx.query('INSERT INTO users (id, name) VALUES (?, ?)', ['1', 'Test'])
        return 'success'
      })

      expect(result).toBe('success')
      expect(db.exec).toHaveBeenCalledWith('COMMIT')
    })

    it('should rollback on error', async () => {
      const { db } = require('@/lib/db')
      const mockStmt = {
        all: jest.fn().mockReturnValue([]),
        run: jest.fn().mockReturnValue({ changes: 1 }),
      }
      db.prepare.mockReturnValue(mockStmt)

      await expect(
        transaction(async (tx) => {
          await tx.query('INSERT INTO users (id, name) VALUES (?, ?)', ['1', 'Test'])
          throw new Error('Transaction error')
        })
      ).rejects.toThrow('Transaction error')

      expect(db.exec).toHaveBeenCalledWith('ROLLBACK')
    })
  })
})



