/**
 * Unit Tests - lib/cashback.ts
 * Matches the real implementation: two queryOne calls per calculateWeeklyCashback
 * (one for total_lost, one for total_won)
 */
import {
  getPreviousWeekWindow,
  calculateWeeklyCashback,
  creditWeeklyCashback,
} from '@/lib/cashback'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'cashback-id-123') }))

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
const mockQuery = query as jest.MockedFunction<typeof query>

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────────────
// getPreviousWeekWindow
// ─────────────────────────────────────────────────────
describe('getPreviousWeekWindow', () => {
  it('returns weekStart on a Monday (UTC day = 1)', () => {
    const { weekStart } = getPreviousWeekWindow()
    const start = new Date(weekStart)
    expect(start.getUTCDay()).toBe(1) // Monday
  })

  it('weekEnd is exactly 7 days after weekStart (previous Mon → this Mon)', () => {
    const { weekStart, weekEnd } = getPreviousWeekWindow()
    const diffDays = (new Date(weekEnd).getTime() - new Date(weekStart).getTime())
      / (1000 * 60 * 60 * 24)
    expect(diffDays).toBe(7)
  })

  it('weekStart is strictly before weekEnd', () => {
    const { weekStart, weekEnd } = getPreviousWeekWindow()
    expect(new Date(weekStart).getTime()).toBeLessThan(new Date(weekEnd).getTime())
  })
})

// ─────────────────────────────────────────────────────
// calculateWeeklyCashback
// NOTE: real impl does 2 queryOne calls: total_lost, then total_won
// ─────────────────────────────────────────────────────
describe('calculateWeeklyCashback', () => {
  it('returns 0 when there are no real-money losses', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ total_lost: 0 })  // losses
      .mockResolvedValueOnce({ total_won: 0 })   // wins
    const amount = await calculateWeeklyCashback('user-1', '2024-01-01', '2024-01-07')
    expect(amount).toBe(0)
  })

  it('returns 0 when wins exceed losses (user is profitable)', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ total_lost: 50 })  // lost 
      .mockResolvedValueOnce({ total_won: 100 })  // won  → net positive
    const amount = await calculateWeeklyCashback('user-1', '2024-01-01', '2024-01-07')
    expect(amount).toBe(0)
  })

  it('calculates 10% of net losses (losses - wins)', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ total_lost: 200 }) // lost 
      .mockResolvedValueOnce({ total_won: 100 })  // won  → net  loss
    const amount = await calculateWeeklyCashback('user-1', '2024-01-01', '2024-01-07')
    expect(amount).toBeCloseTo(10) // 10% of  = 
  })

  it('caps cashback at  maximum even for large losses', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ total_lost: 2000 }) // huge loss
      .mockResolvedValueOnce({ total_won: 0 })     // no wins →  cashback, capped at 
    const amount = await calculateWeeklyCashback('user-1', '2024-01-01', '2024-01-07')
    expect(amount).toBe(150)
  })

  it('returns 0 when queryOne returns null values', async () => {
    mockQueryOne
      .mockResolvedValueOnce(null) // no results for losses
      .mockResolvedValueOnce(null) // no results for wins
    const amount = await calculateWeeklyCashback('user-1', '2024-01-01', '2024-01-07')
    expect(amount).toBe(0)
  })
})

// ─────────────────────────────────────────────────────
// creditWeeklyCashback
// ─────────────────────────────────────────────────────
describe('creditWeeklyCashback', () => {
  it('inserts cashback bonus with 5× wagering requirement', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const bonusId = await creditWeeklyCashback('user-1', 25)

    expect(bonusId).toBe('cashback-id-123')

    // INSERT user_bonuses — wagering = 25 * 5 = 125
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_bonuses'),
      expect.arrayContaining(['cashback-id-123', 'user-1', 25, 125])
    )
  })

  it('credits bonus_balance in the wallet', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    await creditWeeklyCashback('user-1', 30)

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE wallets'),
      expect.arrayContaining([30, 'user-1'])
    )
  })

  it('throws when amount is 0 or negative', async () => {
    await expect(creditWeeklyCashback('user-1', 0)).rejects.toThrow(
      'Cashback amount must be positive'
    )
    await expect(creditWeeklyCashback('user-1', -5)).rejects.toThrow(
      'Cashback amount must be positive'
    )
  })
})
