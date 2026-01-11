/**
 * Bets API Tests
 */
import { POST, GET } from '@/app/api/bets/route'
import { NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-bet-id'),
}))

describe('Bets API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/bets', () => {
    it('should place a single bet successfully', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      const mockQuery = query as jest.MockedFunction<typeof query>

      // Mock session check
      mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
      // Mock pending bets check
      mockQueryOne.mockResolvedValueOnce({ count: 0 })
      // Mock odds validation
      mockQueryOne.mockResolvedValueOnce({ odds_value: 2.5 })
      // Mock wallet balance
      mockQueryOne.mockResolvedValueOnce({ balance: 1000 })
      // Mock balance deduction
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      // Mock updated balance
      mockQueryOne.mockResolvedValueOnce({ balance: 900 })
      // Mock bet creation
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const request = new NextRequest('http://localhost/api/bets', {
        method: 'POST',
        headers: {
          cookie: 'session=mock-session-token',
        },
        body: JSON.stringify({
          betType: 'single',
          matchId: 'match-123',
          marketId: 'market-123',
          selection: 'home',
          odds: 2.5,
          amount: 100,
          currency: 'MAD',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.betId).toBeDefined()
      expect(data.status).toBe('pending')
    })

    it('should reject bet with insufficient balance', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      const mockQuery = query as jest.MockedFunction<typeof query>

      mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
      mockQueryOne.mockResolvedValueOnce({ count: 0 })
      mockQueryOne.mockResolvedValueOnce({ odds_value: 2.5 })
      mockQueryOne.mockResolvedValueOnce({ balance: 50 }) // Insufficient
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Deduction fails

      const request = new NextRequest('http://localhost/api/bets', {
        method: 'POST',
        headers: {
          cookie: 'session=mock-session-token',
        },
        body: JSON.stringify({
          betType: 'single',
          matchId: 'match-123',
          selection: 'home',
          odds: 2.5,
          amount: 100,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Insufficient balance')
    })

    it('should reject bet below minimum amount', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>

      mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
      mockQueryOne.mockResolvedValueOnce({ count: 0 })

      const request = new NextRequest('http://localhost/api/bets', {
        method: 'POST',
        headers: {
          cookie: 'session=mock-session-token',
        },
        body: JSON.stringify({
          betType: 'single',
          matchId: 'match-123',
          selection: 'home',
          odds: 2.5,
          amount: 0.5, // Below minimum
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Minimum bet')
    })

    it('should reject unauthorized requests', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      mockQueryOne.mockResolvedValueOnce(null) // No session

      const request = new NextRequest('http://localhost/api/bets', {
        method: 'POST',
        body: JSON.stringify({
          betType: 'single',
          amount: 100,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/bets', () => {
    it('should return user bets', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      const mockQuery = query as jest.MockedFunction<typeof query>

      mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'bet-1',
            user_id: 'user-123',
            amount: 100,
            status: 'pending',
          },
        ],
        rowCount: 1,
      })

      const request = new NextRequest('http://localhost/api/bets', {
        method: 'GET',
        headers: {
          cookie: 'session=mock-session-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bets).toBeDefined()
      expect(Array.isArray(data.bets)).toBe(true)
    })
  })
})



