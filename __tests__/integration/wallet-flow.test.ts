/** @jest-environment node */
/**
 * Wallet Flow Integration Tests
 * Uses query() with rows arrays — matching wallet.ts real implementation
 */
import { createTransaction, getWalletBalance, lockBalance, unlockBalance } from '@/lib/wallet'
import { query } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id'),
}))

const mockQuery = query as jest.MockedFunction<typeof query>

// Helper — builds the rows object wallet.ts reads
function walletRows(balance: string, bonusBalance = '0', lockedBalance = '0', currency = 'EUR') {
  return {
    rows: [{ balance, bonus_balance: bonusBalance, locked_balance: lockedBalance, currency }],
    rowCount: 1,
  }
}

describe('Wallet Flow Integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should handle complete deposit flow', async () => {
    // getOrCreateWallet SELECT
    mockQuery.mockResolvedValueOnce(walletRows('100.00'))
    // UPDATE wallet balance
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
    // INSERT wallet_transactions
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const transaction = await createTransaction({
      userId: 'user-123',
      type: 'deposit',
      amount: 50.00,
      currency: 'EUR',
      description: 'Test deposit',
    })

    expect(transaction.amount).toBe(50.00)
    expect(transaction.balanceBefore).toBe(100.00)
    expect(transaction.balanceAfter).toBe(150.00)
    expect(transaction.status).toBe('completed')
  })

  it('should handle bet flow: lock -> settle -> unlock', async () => {
    // lockBalance: getOrCreateWallet SELECT (balance=100) + UPDATE
    mockQuery.mockResolvedValueOnce(walletRows('100.00', '0', '0'))
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const lockResult = await lockBalance('user-123', 25.00)
    expect(lockResult).toBe(true)

    // unlockBalance: getOrCreateWallet SELECT (balance=75, locked=25) + UPDATE
    mockQuery.mockResolvedValueOnce(walletRows('75.00', '0', '25.00'))
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    await unlockBalance('user-123', 25.00)

    // createTransaction (win): SELECT + UPDATE + INSERT
    mockQuery.mockResolvedValueOnce(walletRows('100.00'))
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const winTransaction = await createTransaction({
      userId: 'user-123',
      type: 'win',
      amount: 50.00,
      currency: 'EUR',
      description: 'Bet win',
    })

    expect(winTransaction.amount).toBe(50.00)
    expect(winTransaction.balanceBefore).toBe(100.00)
    expect(winTransaction.balanceAfter).toBe(150.00)
  })

  it('should prevent locking more than available balance', async () => {
    mockQuery.mockResolvedValueOnce(walletRows('10.00', '0', '0'))

    const lockResult = await lockBalance('user-123', 50.00)
    expect(lockResult).toBe(false)
    // Only the SELECT should have been called (no UPDATE)
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('should return correct balance from getWalletBalance', async () => {
    mockQuery.mockResolvedValueOnce(walletRows('250.75', '25.00', '10.00', 'EUR'))

    const balance = await getWalletBalance('user-123')

    expect(balance.balance).toBeCloseTo(250.75)
    expect(balance.bonusBalance).toBeCloseTo(25.00)
    expect(balance.lockedBalance).toBeCloseTo(10.00)
    expect(balance.currency).toBe('EUR')
  })
})
