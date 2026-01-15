/**
 * Notifications API Tests
 */
import { GET, POST } from '@/app/api/notifications/route'
import { NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-notification-id'),
}))

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      const mockQuery = query as jest.MockedFunction<typeof query>

      mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            type: 'bet_placed',
            title: 'Bet Placed',
            message: 'Your bet was placed',
            is_read: 0,
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      })
      mockQueryOne.mockResolvedValueOnce({ count: 1 })

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'GET',
        headers: {
          cookie: 'session=mock-session-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notifications).toBeDefined()
      expect(data.unreadCount).toBe(1)
    })

    it('should filter unread notifications', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      const mockQuery = query as jest.MockedFunction<typeof query>

      mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            type: 'bet_placed',
            title: 'Bet Placed',
            message: 'Your bet was placed',
            is_read: 0,
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      })
      mockQueryOne.mockResolvedValueOnce({ count: 1 })

      const request = new NextRequest('http://localhost/api/notifications?unread=true', {
        method: 'GET',
        headers: {
          cookie: 'session=mock-session-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications.every((n: any) => n.is_read === 0)).toBe(true)
    })

    it('should reject unauthorized requests', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      mockQueryOne.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('POST /api/notifications', () => {
    it('should create a notification', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          type: 'bet_placed',
          title: 'Test',
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notificationId).toBeDefined()
    })

    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          // Missing type, title, message
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })
})





