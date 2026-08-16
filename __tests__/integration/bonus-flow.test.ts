/** @jest-environment node */
import { GET as getActiveBonuses } from '@/app/api/bonuses/active/route'
import { POST as forfeitBonus } from '@/app/api/bonuses/forfeit/route'
import { NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'
import * as bonusDb from '@/lib/bonus-db'

jest.mock('@/lib/db')
jest.mock('@/lib/bonus-db', () => ({
  runBonusMigrations: jest.fn(),
  getAllActiveBonuses: jest.fn(),
  hasFingerprintClaimed: jest.fn(),
  recordFingerprintClaim: jest.fn(),
}))

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockGetAllActiveBonuses = bonusDb.getAllActiveBonuses as jest.MockedFunction<typeof bonusDb.getAllActiveBonuses>

function authRequest(url: string, method: 'GET' | 'POST' = 'GET', body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { Authorization: 'Bearer valid-token' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(() => jest.clearAllMocks())

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/bonuses/active
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('GET /api/bonuses/active', () => {
  it('returns 401 when no Authorization header', async () => {
    const req = new NextRequest('http://localhost/api/bonuses/active')
    const res = await getActiveBonuses(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for invalid/expired session token', async () => {
    mockQueryOne.mockResolvedValueOnce(null) // session not found
    const req = authRequest('http://localhost/api/bonuses/active')
    const res = await getActiveBonuses(req)
    expect(res.status).toBe(401)
  })

  it('returns empty bonuses array when user has no active bonuses', async () => {
    mockQueryOne.mockResolvedValueOnce({ user_id: 'user-1' }) // valid session
    mockGetAllActiveBonuses.mockResolvedValueOnce([])

    const req = authRequest('http://localhost/api/bonuses/active')
    const res = await getActiveBonuses(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.bonuses).toEqual([])
    expect(data.total).toBe(0)
  })

  it('returns formatted active bonuses with progress percentage', async () => {
    mockQueryOne.mockResolvedValueOnce({ user_id: 'user-1' })
    mockGetAllActiveBonuses.mockResolvedValueOnce([
      {
        id: 'bonus-1',
        bonus_type: 'welcome',
        status: 'active',
        bonus_amount: 50,
        wagering_requirement: 1750,
        wagering_progress: 875,
        max_bet_limit: 5,
        expires_at: '2024-12-31T00:00:00Z',
        created_at: '2024-12-24T00:00:00Z',
      },
    ])

    const req = authRequest('http://localhost/api/bonuses/active')
    const res = await getActiveBonuses(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(1)
    expect(data.bonuses[0].type).toBe('welcome')
    expect(data.bonuses[0].progressPct).toBe(50) // 875/1750 * 100
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/bonuses/forfeit
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('POST /api/bonuses/forfeit', () => {
  it('returns 401 without Authorization header', async () => {
    const req = new NextRequest('http://localhost/api/bonuses/forfeit', { method: 'POST' })
    const res = await forfeitBonus(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when user has no active bonus', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ user_id: 'user-1' }) // valid session
      .mockResolvedValueOnce(null)                    // no active bonus
    const req = authRequest('http://localhost/api/bonuses/forfeit', 'POST')
    const res = await forfeitBonus(req)
    expect(res.status).toBe(404)
  })

  it('successfully forfeits an active bonus and returns success', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ user_id: 'user-1' })              // valid session
      .mockResolvedValueOnce({ id: 'bonus-1', bonus_amount: 50 }) // active bonus found

    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const req = authRequest('http://localhost/api/bonuses/forfeit', 'POST', { bonusId: 'bonus-1' })
    const res = await forfeitBonus(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.forfeitedAmount).toBe(50)

    // Verify DB: status = forfeited + bonus_balance = 0
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("status = 'forfeited'"),
      expect.any(Array)
    )
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('bonus_balance = 0'),
      expect.any(Array)
    )
  })
})

