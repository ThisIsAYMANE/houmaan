/**
 * Test setup and utilities
 */

import { exec } from '../lib/db'
import path from 'path'
import fs from 'fs'

// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test.db')

/**
 * Setup test database
 */
export async function setupTestDatabase() {
  // Create test database directory if it doesn't exist
  const dbDir = path.dirname(TEST_DB_PATH)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Delete existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }

  // Create new test database
  // Note: This will be handled by the db.ts module when we connect
  console.log('Test database setup complete')
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
}

/**
 * Run migrations on test database
 */
export async function runTestMigrations() {
  // This would run all migrations on the test database
  // For now, we'll use the same migration system
  console.log('Test migrations would run here')
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides: Partial<{
  email: string
  username: string
  password: string
}> = {}) {
  const randomId = Math.random().toString(36).substring(7)
  return {
    email: overrides.email || `test${randomId}@example.com`,
    username: overrides.username || `testuser${randomId}`,
    password: overrides.password || 'TestPassword123!',
  }
}

/**
 * Generate test transaction data
 */
export function generateTestTransaction(overrides: Partial<{
  userId: string
  type: string
  amount: number
  currency: string
}> = {}) {
  return {
    userId: overrides.userId || 'test-user-id',
    type: overrides.type || 'deposit',
    amount: overrides.amount || 100,
    currency: overrides.currency || 'MAD',
  }
}




