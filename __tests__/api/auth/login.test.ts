/** @jest-environment node */
/**
 * Auth Login API Tests
 */
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'
import { getUserByEmail, verifyPassword, createSession } from '@/lib/auth'

jest.mock('@/lib/auth')

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.resetAllMocks()
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

    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
    const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>
    const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>

    mockGetUserByEmail.mockResolvedValue(mockUser as any)
    mockVerifyPassword.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue('mock-session-token')

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
    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
    const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>

    mockGetUserByEmail.mockResolvedValue({
      id: 'user-123',
      email: 'test@test.com',
      password_hash: 'hashed-password',
      username: 'testuser',
      avatar: null,
      vip_level: 0,
      is_active: true,
    } as any)
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
    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
    mockGetUserByEmail.mockResolvedValue(null)

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
    const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
    const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>

    mockGetUserByEmail.mockResolvedValue({
      id: 'user-123',
      email: 'test@test.com',
      password_hash: 'hashed-password',
      username: 'testuser',
      avatar: null,
      vip_level: 0,
      is_active: false,
    } as any)
    mockVerifyPassword.mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})
