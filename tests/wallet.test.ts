/**
 * Wallet system tests
 * 
 * To run: npx tsx tests/wallet.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import {
  getOrCreateWallet,
  getWalletBalance,
  createTransaction,
  lockBalance,
  unlockBalance,
  getTransactionHistory,
  verifyBalance,
} from '../lib/wallet'
import { createUser } from '../lib/auth'
import { nanoid } from 'nanoid'

// Mock database for testing
// In a real scenario, you'd use a test database

describe('Wallet System', () => {
  let testUserId: string

  beforeAll(async () => {
    // Create a test user
    testUserId = await createUser({
      email: `test${nanoid()}@example.com`,
      password: 'TestPassword123!',
      username: `testuser${nanoid()}`,
    })
  })

  describe('getOrCreateWallet', () => {
    it('should create a new wallet if it does not exist', async () => {
      const wallet = await getOrCreateWallet(testUserId)
      expect(wallet).toBeDefined()
      expect(wallet.balance).toBe(0)
      expect(wallet.bonusBalance).toBe(0)
      expect(wallet.lockedBalance).toBe(0)
      expect(wallet.currency).toBe('MAD')
    })

    it('should return existing wallet if it exists', async () => {
      const wallet1 = await getOrCreateWallet(testUserId)
      const wallet2 = await getOrCreateWallet(testUserId)
      expect(wallet1.balance).toBe(wallet2.balance)
    })
  })

  describe('createTransaction', () => {
    it('should create a deposit transaction', async () => {
      const transaction = await createTransaction({
        userId: testUserId,
        type: 'deposit',
        amount: 100,
        description: 'Test deposit',
      })

      expect(transaction).toBeDefined()
      expect(transaction.type).toBe('deposit')
      expect(transaction.amount).toBe(100)
      expect(transaction.balanceAfter).toBe(100)
    })

    it('should update wallet balance after transaction', async () => {
      const balanceBefore = await getWalletBalance(testUserId)
      
      await createTransaction({
        userId: testUserId,
        type: 'deposit',
        amount: 50,
      })

      const balanceAfter = await getWalletBalance(testUserId)
      expect(balanceAfter.balance).toBe(balanceBefore.balance + 50)
    })
  })

  describe('lockBalance', () => {
    it('should lock balance for active bets', async () => {
      // First, ensure user has balance
      await createTransaction({
        userId: testUserId,
        type: 'deposit',
        amount: 100,
      })

      const result = await lockBalance(testUserId, 50)
      expect(result).toBe(true)

      const wallet = await getWalletBalance(testUserId)
      expect(wallet.lockedBalance).toBe(50)
      expect(wallet.balance).toBe(50) // 100 - 50 locked
    })

    it('should return false if insufficient balance', async () => {
      const result = await lockBalance(testUserId, 10000)
      expect(result).toBe(false)
    })
  })

  describe('unlockBalance', () => {
    it('should unlock balance when bet is settled', async () => {
      await lockBalance(testUserId, 30)
      
      await unlockBalance(testUserId, 30)

      const wallet = await getWalletBalance(testUserId)
      expect(wallet.lockedBalance).toBe(0)
    })
  })

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      // Create some transactions
      await createTransaction({
        userId: testUserId,
        type: 'deposit',
        amount: 25,
      })

      const history = await getTransactionHistory(testUserId, { limit: 10 })
      
      expect(history.transactions.length).toBeGreaterThan(0)
      expect(history.total).toBeGreaterThan(0)
    })

    it('should filter transactions by type', async () => {
      const history = await getTransactionHistory(testUserId, {
        type: 'deposit',
        limit: 10,
      })

      history.transactions.forEach((tx) => {
        expect(tx.type).toBe('deposit')
      })
    })
  })

  describe('verifyBalance', () => {
    it('should verify balance matches transactions', async () => {
      const verification = await verifyBalance(testUserId)
      
      expect(verification.isValid).toBe(true)
      expect(verification.expectedBalance).toBe(verification.actualBalance)
    })
  })
})


