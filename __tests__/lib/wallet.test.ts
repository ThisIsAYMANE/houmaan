/**
 * Wallet Utility Tests
 */
import {
  getOrCreateWallet,
  getWalletBalance,
  createTransaction,
  lockBalance,
  unlockBalance,
} from '@/lib/wallet'
import { query, queryOne } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id-123'),
}))

describe('Wallet Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateWallet', () => {
    it('should return existing wallet', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      
      mockQueryOne.mockResolvedValue({
        balance: '100.50',
        bonus_balance: '10.00',
        locked_balance: '5.00',
        currency: 'MAD',
      })

      const wallet = await getOrCreateWallet('user-123')

      expect(wallet).toEqual({
        balance: 100.50,
        bonusBalance: 10.00,
        lockedBalance: 5.00,
        currency: 'MAD',
      })
    })

    it('should create new wallet if not exists', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      
      mockQueryOne
        .mockResolvedValueOnce(null) // First call for existing wallet check
        .mockResolvedValueOnce(null) // Second call if error handling
      
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

      const wallet = await getOrCreateWallet('user-123', 'MAD')

      expect(wallet).toEqual({
        balance: 0,
        bonusBalance: 0,
        lockedBalance: 0,
        currency: 'MAD',
      })
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wallets'),
        expect.any(Array)
      )
    })
  })

  describe('getWalletBalance', () => {
    it('should return wallet balance', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      mockQueryOne.mockResolvedValue({
        balance: '250.75',
        bonus_balance: '25.00',
        locked_balance: '10.00',
        currency: 'MAD',
      })

      const balance = await getWalletBalance('user-123')

      expect(balance.balance).toBe(250.75)
      expect(balance.bonusBalance).toBe(25.00)
      expect(balance.lockedBalance).toBe(10.00)
    })
  })

  describe('createTransaction', () => {
    it('should create a transaction and update balance', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      
      mockQueryOne.mockResolvedValue({
        balance: '100.00',
        bonus_balance: '0',
        locked_balance: '0',
        currency: 'MAD',
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Update wallet
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert transaction

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
      expect(transaction.status).toBe('completed')
    })
  })

  describe('lockBalance', () => {
    it('should lock balance successfully', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      
      mockQueryOne.mockResolvedValue({
        balance: '100.00',
        bonus_balance: '0',
        locked_balance: '0',
        currency: 'MAD',
      })

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

      const result = await lockBalance('user-123', 25.00)

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets'),
        expect.arrayContaining([75.00, 25.00, 'user-123'])
      )
    })

    it('should return false if insufficient balance', async () => {
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      
      mockQueryOne.mockResolvedValue({
        balance: '10.00',
        bonus_balance: '0',
        locked_balance: '0',
        currency: 'MAD',
      })

      const result = await lockBalance('user-123', 25.00)

      expect(result).toBe(false)
    })
  })

  describe('unlockBalance', () => {
    it('should unlock balance and restore to wallet', async () => {
      const mockQuery = query as jest.MockedFunction<typeof query>
      const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>
      
      mockQueryOne.mockResolvedValue({
        balance: '50.00',
        bonus_balance: '0',
        locked_balance: '25.00',
        currency: 'MAD',
      })

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })

      await unlockBalance('user-123', 25.00)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallets'),
        expect.arrayContaining([75.00, 0, 'user-123'])
      )
    })
  })
})

