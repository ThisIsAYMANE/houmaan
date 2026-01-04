/**
 * Authentication Utility Tests
 */
import { hashPassword, verifyPassword, createSession, getUserByEmail } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id-123'),
}))

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      // bcrypt should produce different hashes due to salt
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('wrongpassword', hash)
      expect(isValid).toBe(false)
    })
  })

  describe('createSession', () => {
    it('should create a session', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

      const userId = 'user-123'
      const sessionToken = await createSession(userId)

      expect(sessionToken).toBeDefined()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        expect.any(Array)
      )
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        username: 'testuser',
        password_hash: 'hashed',
        avatar: null,
        vip_level: 0,
        is_active: true,
      }
      mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })

      const user = await getUserByEmail('test@test.com')

      expect(user).toEqual(mockUser)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@test.com']
      )
    })

    it('should return null when user not found', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

      const user = await getUserByEmail('nonexistent@test.com')

      expect(user).toBeNull()
    })
  })
})


