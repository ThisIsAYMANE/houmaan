/**
 * Wallet Utility Tests
 * Matches the real wallet.ts implementation which uses query() with rows arrays
 */
import {
  getOrCreateWallet,
  getWalletBalance,
  createTransaction,
  lockBalance,
  unlockBalance,
} from '@/lib/wallet'
import { query } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id-123'),
}))

const mockQuery = query as jest.MockedFunction<typeof query>

// Helper to build the rows response that wallet.ts expects
function walletRows(balance: string, bonusBalance = '0', lockedBalance = '0', currency = 'EUR') {
  return {
    rows: [{
      balance,
      bonus_balance: bonusBalance,
      locked_balance: lockedBalance,
      currency,
    }],
    rowCount: 1,
  }
}

describe('Wallet Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateWallet', () => {
    it('returns existing wallet with correct parsed values', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('100.50', '10.00', '5.00', 'EUR'))

      const wallet = await getOrCreateWallet('user-123')

      expect(wallet.balance).toBeCloseTo(100.50)
      expect(wallet.bonusBalance).toBeCloseTo(10.00)
      expect(wallet.lockedBalance).toBeCloseTo(5.00)
      expect(wallet.currency).toBe('EUR')
    })

    it('creates new wallet when none exists and returns zero balances', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // no existing wallet
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT succeeds

      const wallet = await getOrCreateWallet('user-123', 'EUR')

      expect(wallet.balance).toBe(0)
      expect(wallet.bonusBalance).toBe(0)
      expect(wallet.lockedBalance).toBe(0)
      expect(wallet.currency).toBe('EUR')
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wallets'),
        expect.any(Array)
      )
    })
  })

  describe('getWalletBalance', () => {
    it('returns parsed wallet balance from query result', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('250.75', '25.00', '10.00'))

      const balance = await getWalletBalance('user-123')

      expect(balance.balance).toBeCloseTo(250.75)
      expect(balance.bonusBalance).toBeCloseTo(25.00)
      expect(balance.lockedBalance).toBeCloseTo(10.00)
    })

    it('returns zero balances for new user (no wallet yet)', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // no wallet
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT

      const balance = await getWalletBalance('new-user')
      expect(balance.balance).toBe(0)
    })
  })

  describe('createTransaction', () => {
    it('updates wallet balance and inserts transaction record', async () => {
      // 1. getOrCreateWallet → existing balance = 100
      mockQuery.mockResolvedValueOnce(walletRows('100.00'))
      // 2. UPDATE wallet balance
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      // 3. INSERT wallet_transactions
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      const tx = await createTransaction({
        userId: 'user-123',
        type: 'deposit',
        amount: 50.00,
        currency: 'EUR',
        description: 'Test deposit',
      })

      expect(tx.amount).toBe(50.00)
      expect(tx.balanceBefore).toBe(100.00)
      expect(tx.balanceAfter).toBe(150.00)
      expect(tx.status).toBe('completed')
      expect(tx.type).toBe('deposit')
    })

    it('inserts correct SQL for UPDATE wallets and INSERT wallet_transactions', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('200.00'))
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await createTransaction({ userId: 'user-1', type: 'bet', amount: -30 })

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets'),
        expect.arrayContaining([170, 'user-1'])
      )
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wallet_transactions'),
        expect.any(Array)
      )
    })
  })

  describe('lockBalance', () => {
    it('deducts from balance and adds to locked_balance when sufficient funds', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('100.00', '0', '0'))
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE

      const result = await lockBalance('user-123', 25.00)

      expect(result).toBe(true)
      // balance = 75, locked = 25
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets'),
        expect.arrayContaining([75.00, 25.00, 'user-123'])
      )
    })

    it('returns false without updating DB when balance < amount', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('10.00', '0', '0'))

      const result = await lockBalance('user-123', 25.00)

      expect(result).toBe(false)
      // Should only have been called once (the SELECT for balance check)
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('unlockBalance', () => {
    it('restores amount to balance and reduces locked_balance', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('50.00', '0', '25.00'))
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE

      await unlockBalance('user-123', 25.00)

      // balance = 75 (50 + 25), locked = 0 (max(0, 25-25))
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets'),
        expect.arrayContaining([75.00, 0, 'user-123'])
      )
    })

    it('does not allow locked_balance to go negative', async () => {
      mockQuery.mockResolvedValueOnce(walletRows('100.00', '0', '5.00'))
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await unlockBalance('user-123', 25.00) // unlock more than locked

      // locked = max(0, 5 - 25) = 0
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets'),
        expect.arrayContaining([0, 'user-123'])
      )
    })
  })
})





