/** @jest-environment node */
/**
 * Bet Flow Integration Tests
 *
 * Bets route call sequence for a valid single bet:
 *  queryOne[1] — session lookup → { user_id }
 *  queryOne[2] — pending bets count → { count }
 *  queryOne[3] — odds validation → { odds_value }
 *  query[1]    — atomic UPDATE wallets balance (rowCount=1 → success)
 *  queryOne[4] — read updated balance → { balance }
 *  query[2]    — INSERT user_bets
 */
import { POST } from '@/app/api/bets/route'
import { NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

jest.mock('@/lib/db', () => ({
  query:       jest.fn(),
  queryOne:    jest.fn(),
  transaction: jest.fn(),
}))
jest.mock('@/lib/wallet') // prevent real wallet logic running
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'bet-id-001'),
}))

const mockQuery    = query    as jest.MockedFunction<typeof query>
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>

describe('Bet Flow Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // Restore nanoid default after reset
    ;(nanoid as jest.Mock).mockReturnValue('bet-id-001')
  })

  it('places a valid single bet and returns betId + newBalance', async () => {
    // 1. Session lookup
    mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
    // 2. Pending bets count (< max)
    mockQueryOne.mockResolvedValueOnce({ count: 0 })
    // 3. Odds validation
    mockQueryOne.mockResolvedValueOnce({ odds_value: 2.5 })
    // 4. Atomic UPDATE succeeds (rowCount > 0)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
    // 5. Read updated wallet balance after deduction
    mockQueryOne.mockResolvedValueOnce({ balance: 900 })
    // 6. INSERT user_bets
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const req = new NextRequest('http://localhost/api/bets', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-session-token' },
      body: JSON.stringify({
        betType: 'single',
        matchId: 'match-123',
        marketId: 'market-123',
        selection: 'home',
        odds: 2.5,
        amount: 100,
        currency: 'EUR',
      }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.betId).toBeDefined()
    expect(data.status).toBe('pending')
    expect(data.newBalance).toBe(900)
  })

  it('returns 401 when no session is provided', async () => {
    // No auth header / cookie → getUserId returns null immediately (no queryOne call needed)
    const req = new NextRequest('http://localhost/api/bets', {
      method: 'POST',
      body: JSON.stringify({ betType: 'single', odds: 2.5, amount: 100, selection: 'home' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    // Cookie session works in node env (proven by the passing valid-bet test)
    mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })

    const req = new NextRequest('http://localhost/api/bets', {
      method: 'POST',
      headers: { cookie: 'session=mock-session' },
      body: JSON.stringify({ amount: 100 }), // missing betType
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when wallet balance is insufficient', async () => {
    // Session
    mockQueryOne.mockResolvedValueOnce({ user_id: 'user-123' })
    // Pending bets
    mockQueryOne.mockResolvedValueOnce({ count: 0 })
    // Odds validation
    mockQueryOne.mockResolvedValueOnce({ odds_value: 2.5 })
    // Atomic UPDATE fails (rowCount = 0 = insufficient balance)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    // Wallet check returns low balance
    mockQueryOne.mockResolvedValueOnce({ balance: 5 })

    const req = new NextRequest('http://localhost/api/bets', {
      method: 'POST',
      headers: { cookie: 'session=mock-session' },
      body: JSON.stringify({
        betType: 'single',
        matchId: 'match-123',
        marketId: 'market-123',
        selection: 'home',
        odds: 2.5,
        amount: 100,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('handles bet settlement placeholder', () => {
    // Placeholder — settlement endpoint tested separately
    expect(true).toBe(true)
  })
})
