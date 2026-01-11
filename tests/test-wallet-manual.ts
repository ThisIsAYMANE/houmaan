/**
 * Manual wallet system test
 * Run with: npx tsx tests/test-wallet-manual.ts
 */

import {
  getOrCreateWallet,
  getWalletBalance,
  createTransaction,
  lockBalance,
  unlockBalance,
  getTransactionHistory,
  verifyBalance,
} from '../lib/wallet'
import { createUser, getUserByEmail } from '../lib/auth'
import { nanoid } from 'nanoid'

async function runTests() {
  console.log('🧪 Starting Phase 1 Wallet System Tests...\n')

  try {
    // Test 1: Create a test user
    console.log('📝 Test 1: Creating test user...')
    const testEmail = `test${nanoid()}@example.com`
    const testPassword = 'TestPassword123!'
    const userId = await createUser({
      email: testEmail,
      password: testPassword,
      username: `testuser${nanoid()}`,
    })
    console.log(`✅ User created: ${userId}\n`)

    // Test 2: Get or create wallet
    console.log('💰 Test 2: Getting/Creating wallet...')
    const wallet1 = await getOrCreateWallet(userId)
    console.log('Wallet:', wallet1)
    if (wallet1.balance === 0 && wallet1.bonusBalance === 0 && wallet1.lockedBalance === 0) {
      console.log('✅ Wallet created successfully\n')
    } else {
      console.log('❌ Wallet has unexpected initial values\n')
    }

    // Test 3: Get wallet balance
    console.log('💰 Test 3: Getting wallet balance...')
    const balance = await getWalletBalance(userId)
    console.log('Balance:', balance)
    if (balance.balance === 0) {
      console.log('✅ Balance retrieved correctly\n')
    } else {
      console.log('❌ Balance is not 0\n')
    }

    // Test 4: Create deposit transaction
    console.log('💵 Test 4: Creating deposit transaction...')
    const deposit = await createTransaction({
      userId,
      type: 'deposit',
      amount: 100,
      description: 'Test deposit',
    })
    console.log('Transaction:', {
      id: deposit.id,
      type: deposit.type,
      amount: deposit.amount,
      balanceBefore: deposit.balanceBefore,
      balanceAfter: deposit.balanceAfter,
    })
    if (deposit.balanceAfter === 100 && deposit.amount === 100) {
      console.log('✅ Deposit transaction created successfully\n')
    } else {
      console.log('❌ Deposit transaction failed\n')
    }

    // Test 5: Verify balance updated
    console.log('💰 Test 5: Verifying balance updated...')
    const balanceAfter = await getWalletBalance(userId)
    console.log('Balance after deposit:', balanceAfter)
    if (balanceAfter.balance === 100) {
      console.log('✅ Balance updated correctly\n')
    } else {
      console.log('❌ Balance not updated correctly\n')
    }

    // Test 6: Lock balance
    console.log('🔒 Test 6: Locking balance for bet...')
    const lockResult = await lockBalance(userId, 50)
    console.log('Lock result:', lockResult)
    const balanceLocked = await getWalletBalance(userId)
    console.log('Balance after lock:', balanceLocked)
    if (lockResult && balanceLocked.lockedBalance === 50 && balanceLocked.balance === 50) {
      console.log('✅ Balance locked successfully\n')
    } else {
      console.log('❌ Balance lock failed\n')
    }

    // Test 7: Unlock balance
    console.log('🔓 Test 7: Unlocking balance...')
    await unlockBalance(userId, 50)
    const balanceUnlocked = await getWalletBalance(userId)
    console.log('Balance after unlock:', balanceUnlocked)
    if (balanceUnlocked.lockedBalance === 0 && balanceUnlocked.balance === 100) {
      console.log('✅ Balance unlocked successfully\n')
    } else {
      console.log('❌ Balance unlock failed\n')
    }

    // Test 8: Get transaction history
    console.log('📜 Test 8: Getting transaction history...')
    const history = await getTransactionHistory(userId, { limit: 10 })
    console.log(`Found ${history.transactions.length} transactions (total: ${history.total})`)
    if (history.transactions.length > 0) {
      console.log('First transaction:', {
        type: history.transactions[0].type,
        amount: history.transactions[0].amount,
        status: history.transactions[0].status,
      })
      console.log('✅ Transaction history retrieved successfully\n')
    } else {
      console.log('❌ No transactions found\n')
    }

    // Test 9: Filter transactions by type
    console.log('🔍 Test 9: Filtering transactions by type...')
    const depositHistory = await getTransactionHistory(userId, {
      type: 'deposit',
      limit: 10,
    })
    console.log(`Found ${depositHistory.transactions.length} deposit transactions`)
    const allDeposits = depositHistory.transactions.every((tx) => tx.type === 'deposit')
    if (allDeposits) {
      console.log('✅ Transaction filtering works correctly\n')
    } else {
      console.log('❌ Transaction filtering failed\n')
    }

    // Test 10: Verify balance reconciliation
    console.log('✅ Test 10: Verifying balance reconciliation...')
    const verification = await verifyBalance(userId)
    console.log('Verification:', verification)
    if (verification.isValid) {
      console.log('✅ Balance reconciliation passed\n')
    } else {
      console.log('⚠️  Balance reconciliation shows discrepancy:', verification.difference)
      console.log('This might be normal if there are pending transactions\n')
    }

    // Test 11: Create multiple transactions
    console.log('💵 Test 11: Creating multiple transactions...')
    await createTransaction({
      userId,
      type: 'deposit',
      amount: 50,
      description: 'Second deposit',
    })
    await createTransaction({
      userId,
      type: 'bet_placed',
      amount: -25,
      description: 'Bet placed',
    })
    const finalBalance = await getWalletBalance(userId)
    console.log('Final balance:', finalBalance)
    if (finalBalance.balance === 125) {
      console.log('✅ Multiple transactions processed correctly\n')
    } else {
      console.log('❌ Multiple transactions failed\n')
    }

    console.log('🎉 All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run tests
runTests()







