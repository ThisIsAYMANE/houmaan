/**
 * Auth Login API Tests
 */
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

jest.mock('@/lib/db')
jest.mock('@/lib/auth')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-session-token'),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login user with valid credentials', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@test.com',
      password_hash: 'hashed-password',
      username: 'testuser',
      avatar: null,
      vip_level: 0,
      is_active: true,
    }

    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>
    const mockQuery = query as jest.MockedFunction<typeof query>

    mockQueryOne.mockResolvedValue(mockUser)
    mockVerifyPassword.mockResolvedValue(true)
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('test@test.com')
    expect(data.data.sessionToken).toBeDefined()
  })

  it('should reject invalid credentials', async () => {
    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>

    mockQueryOne.mockResolvedValue({
      id: 'user-123',
      email: 'test@test.com',
      password_hash: 'hashed-password',
      username: 'testuser',
      avatar: null,
      vip_level: 0,
      is_active: true,
    })
    mockVerifyPassword.mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should reject non-existent user', async () => {
    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    mockQueryOne.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should reject inactive user', async () => {
    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    mockQueryOne.mockResolvedValue({
      id: 'user-123',
      email: 'test@test.com',
      password_hash: 'hashed-password',
      username: 'testuser',
      avatar: null,
      vip_level: 0,
      is_active: false,
    })

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })
})


