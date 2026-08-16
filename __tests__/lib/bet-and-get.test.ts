/**
 * Unit Tests — lib/bet-and-get.ts
 * Tests: meetsOddsFloor, americanToDecimal, checkBetAndGetEligibility, awardBetAndGet
 */
import {
  meetsOddsFloor,
  americanToDecimal,
  checkBetAndGetEligibility,
  awardBetAndGet,
} from '@/lib/bet-and-get'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'bonus-id-123') }))

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
const mockQuery = query as jest.MockedFunction<typeof query>

beforeEach(() => jest.clearAllMocks())

// ────────────────────────────────────────────────────────────────────
// meetsOddsFloor
// ────────────────────────────────────────────────────────────────────
describe('meetsOddsFloor', () => {
  it('returns true for odds exactly at the 1.50 floor', () => {
    expect(meetsOddsFloor(1.50)).toBe(true)
  })

  it('returns true for odds above 1.50', () => {
    expect(meetsOddsFloor(2.00)).toBe(true)
    expect(meetsOddsFloor(5.50)).toBe(true)
    expect(meetsOddsFloor(10.0)).toBe(true)
  })

  it('returns false for odds below 1.50', () => {
    expect(meetsOddsFloor(1.49)).toBe(false)
    expect(meetsOddsFloor(1.0)).toBe(false)
    expect(meetsOddsFloor(1.25)).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────
// americanToDecimal
// ────────────────────────────────────────────────────────────────────
describe('americanToDecimal', () => {
  it('converts +100 (evens) → 2.00', () => {
    expect(americanToDecimal(100)).toBeCloseTo(2.0)
  })

  it('converts +200 → 3.00', () => {
    expect(americanToDecimal(200)).toBeCloseTo(3.0)
  })

  it('converts -200 → 1.50 (the qualifying floor)', () => {
    expect(americanToDecimal(-200)).toBeCloseTo(1.5)
  })

  it('converts -100 → 2.00', () => {
    expect(americanToDecimal(-100)).toBeCloseTo(2.0)
  })

  it('converts -400 → 1.25 (below qualifying threshold)', () => {
    expect(americanToDecimal(-400)).toBeCloseTo(1.25)
  })
})

// ────────────────────────────────────────────────────────────────────
// checkBetAndGetEligibility
// ────────────────────────────────────────────────────────────────────
describe('checkBetAndGetEligibility', () => {
  const eligibleBet = {
    id: 'bet-1',
    user_id: 'user-1',
    amount: 30,
    odds: 2.0,
    status: 'lost',
    bet_type: 'single',
    funded_by: 'real',
  }

  it('✅ returns eligible for a valid qualifying lost bet', async () => {
    mockQueryOne
      .mockResolvedValueOnce(eligibleBet) // bet lookup
      .mockResolvedValueOnce(null)         // no prior claim
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('❌ returns ineligible when bet is not found', async () => {
    mockQueryOne.mockResolvedValueOnce(null)
    const result = await checkBetAndGetEligibility('user-1', 'missing-bet')
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Bet not found')
  })

  it('❌ returns ineligible when bet status is won (not a loss)', async () => {
    mockQueryOne.mockResolvedValueOnce({ ...eligibleBet, status: 'won' })
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Bet must be a loss')
  })

  it('❌ returns ineligible for accumulator/parlay bets', async () => {
    mockQueryOne.mockResolvedValueOnce({ ...eligibleBet, bet_type: 'accumulator' })
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Only single bets qualify')
  })

  it('❌ returns ineligible when bet was funded by a bonus', async () => {
    mockQueryOne.mockResolvedValueOnce({ ...eligibleBet, funded_by: 'bonus' })
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Bonus-funded bets do not qualify')
  })

  it('❌ returns ineligible when stake < $25 minimum', async () => {
    mockQueryOne.mockResolvedValueOnce({ ...eligibleBet, amount: 24.99 })
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('Minimum stake')
  })

  it('❌ returns ineligible when odds < 1.50 floor', async () => {
    mockQueryOne.mockResolvedValueOnce({ ...eligibleBet, odds: 1.49 })
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('Minimum odds')
  })

  it('❌ returns ineligible when user already claimed Bet & Get', async () => {
    mockQueryOne
      .mockResolvedValueOnce(eligibleBet)
      .mockResolvedValueOnce({ id: 'prior-bonus' }) // prior claim exists
    const result = await checkBetAndGetEligibility('user-1', 'bet-1')
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Bet & Get already claimed')
  })
})

// ────────────────────────────────────────────────────────────────────
// awardBetAndGet
// ────────────────────────────────────────────────────────────────────
describe('awardBetAndGet', () => {
  it('inserts bonus record with correct values and credits $10 bonus_balance', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    const bonusId = await awardBetAndGet('user-1')

    expect(bonusId).toBe('bonus-id-123')

    // Call 1: INSERT INTO user_bonuses
    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO user_bonuses'),
      expect.arrayContaining(['bonus-id-123', 'user-1', 10])
    )

    // Call 2: UPDATE wallets SET bonus_balance
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE wallets'),
      expect.arrayContaining([10, 'user-1'])
    )
  })
})
