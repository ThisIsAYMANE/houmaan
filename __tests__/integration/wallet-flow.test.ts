/**
 * Wallet Flow Integration Tests
 */
import { createTransaction, getWalletBalance, lockBalance, unlockBalance } from '@/lib/wallet'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id'),
}))

describe('Wallet Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle complete deposit flow', async () => {
    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    const mockQuery = query as jest.MockedFunction<typeof query>

    // Initial balance
    mockQueryOne.mockResolvedValue({
      balance: '100.00',
      bonus_balance: '0',
      locked_balance: '0',
      currency: 'MAD',
    })

    // After deposit
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Update wallet
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Create transaction

    mockQueryOne.mockResolvedValueOnce({
      balance: '150.00',
      bonus_balance: '0',
      locked_balance: '0',
      currency: 'MAD',
    })

    const transaction = await createTransaction({
      userId: 'user-123',
      type: 'deposit',
      amount: 50.00,
      currency: 'MAD',
      description: 'Test deposit',
    })

    expect(transaction.amount).toBe(50.00)
    expect(transaction.balanceBefore).toBe(100.00)
    expect(transaction.balanceAfter).toBe(150.00)
  })

  it('should handle bet flow: lock -> settle -> unlock', async () => {
    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    const mockQuery = query as jest.MockedFunction<typeof query>

    // Initial balance
    mockQueryOne
      .mockResolvedValueOnce({
        balance: '100.00',
        bonus_balance: '0',
        locked_balance: '0',
        currency: 'MAD',
      })
      .mockResolvedValueOnce({
        balance: '75.00',
        bonus_balance: '0',
        locked_balance: '25.00',
        currency: 'MAD',
      })

    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

    // Lock balance for bet
    const lockResult = await lockBalance('user-123', 25.00)
    expect(lockResult).toBe(true)

    // Simulate bet win - unlock and add winnings
    mockQueryOne.mockResolvedValueOnce({
      balance: '75.00',
      bonus_balance: '0',
      locked_balance: '25.00',
      currency: 'MAD',
    })

    await unlockBalance('user-123', 25.00)

    // Create win transaction
    mockQueryOne.mockResolvedValueOnce({
      balance: '100.00',
      bonus_balance: '0',
      locked_balance: '0',
      currency: 'MAD',
    })

    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const winTransaction = await createTransaction({
      userId: 'user-123',
      type: 'win',
      amount: 50.00,
      currency: 'MAD',
      description: 'Bet win',
    })

    expect(winTransaction.amount).toBe(50.00)
  })

  it('should prevent negative balance', async () => {
    const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
    const mockQuery = query as jest.MockedFunction<typeof query>

    mockQueryOne.mockResolvedValue({
      balance: '10.00',
      bonus_balance: '0',
      locked_balance: '0',
      currency: 'MAD',
    })

    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 }) // Update fails

    const lockResult = await lockBalance('user-123', 50.00)
    expect(lockResult).toBe(false)
  })
})


