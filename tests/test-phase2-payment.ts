/**
 * Phase 2 Testing: Payment Detection
 * Tests payment detection and status updates
 * 
 * Usage: npx tsx tests/test-phase2-payment.ts <depositId>
 */

import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:3000'
let sessionToken: string | null = null

async function testLogin() {
  console.log('\n📝 Step 1: Login...')
  
  // Try to login with a known test account
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'test123456',
    }),
  })

  const data = await response.json()
  
  if (data.success && data.data.sessionToken) {
    sessionToken = data.data.sessionToken
    console.log('✅ Login successful')
    return true
  } else {
    console.log('⚠️  Login failed, trying registration...')
    // Register a new user if login fails
    return await testRegister()
  }
}

async function testRegister() {
  console.log('\n📝 Registering test user...')
  
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test-phase2-${Date.now()}@example.com`,
      password: 'test123456',
      username: `testuser${Date.now()}`,
    }),
  })

  const data = await response.json()
  
  if (data.success && data.data.sessionToken) {
    sessionToken = data.data.sessionToken
    console.log('✅ User registered successfully')
    return true
  } else {
    console.log('❌ Registration failed:', data)
    return false
  }
}

async function testCheckPaymentStatus(depositId: string) {
  console.log(`\n📝 Step 2: Check payment status for deposit ${depositId}...`)
  
  if (!sessionToken) {
    console.log('❌ No session token available')
    return null
  }

  const response = await fetch(`${API_URL}/api/payments/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ depositId }),
  })

  const data = await response.json()
  
  if (data.success && data.data) {
    const status = data.data
    console.log('✅ Payment status retrieved')
    console.log(`   Has Payment: ${status.hasPayment ? 'Yes ✅' : 'No ❌'}`)
    console.log(`   Confirmed: ${status.confirmed ? 'Yes ✅' : 'No ⏳'}`)
    console.log(`   Confirmations: ${status.confirmations}/${status.requiredConfirmations || 1}`)
    console.log(`   TX Hash: ${status.txHash || 'Not yet'}`)
    console.log(`   Amount: ${status.amount} BTC`)
    
    return status
  } else {
    console.log('❌ Failed to check payment status:', data)
    return null
  }
}

async function testGetDepositStatus(depositId: string) {
  console.log(`\n📝 Step 3: Get full deposit details...`)
  
  if (!sessionToken) {
    console.log('❌ No session token available')
    return null
  }

  const response = await fetch(
    `${API_URL}/api/payments/deposit?depositId=${depositId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    }
  )

  const data = await response.json()
  
  if (data.success && data.data) {
    const deposit = data.data
    console.log('✅ Deposit details retrieved')
    console.log(`   Status: ${deposit.status}`)
    console.log(`   Amount: ${deposit.amount} ${deposit.currency}`)
    console.log(`   BTC Amount: ${deposit.btcAmount} BTC`)
    console.log(`   Address: ${deposit.address}`)
    console.log(`   TX Hash: ${deposit.txHash || 'Not yet'}`)
    console.log(`   Confirmations: ${deposit.confirmations}/${deposit.requiredConfirmations}`)
    console.log(`   Expires At: ${deposit.expiresAt}`)
    
    return deposit
  } else {
    console.log('❌ Failed to get deposit status:', data)
    return null
  }
}

async function testWalletBalance() {
  console.log(`\n📝 Step 4: Check wallet balance...`)
  
  if (!sessionToken) {
    console.log('❌ No session token available')
    return null
  }

  const response = await fetch(`${API_URL}/api/wallet/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
  })

  const data = await response.json()
  
  if (data.success && data.data) {
    const balance = data.data
    console.log('✅ Wallet balance retrieved')
    console.log(`   Balance: ${balance.balance} ${balance.currency}`)
    console.log(`   Bonus Balance: ${balance.bonusBalance} ${balance.currency}`)
    console.log(`   Locked Balance: ${balance.lockedBalance} ${balance.currency}`)
    
    return balance
  } else {
    console.log('❌ Failed to get wallet balance:', data)
    return null
  }
}

async function testTransactionHistory() {
  console.log(`\n📝 Step 5: Check transaction history...`)
  
  if (!sessionToken) {
    console.log('❌ No session token available')
    return null
  }

  const response = await fetch(
    `${API_URL}/api/wallet/transactions?limit=10&type=deposit`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    }
  )

  const data = await response.json()
  
  if (data.success && data.data) {
    const transactions = data.data.transactions || []
    console.log('✅ Transaction history retrieved')
    console.log(`   Total Deposits: ${transactions.length}`)
    
    if (transactions.length > 0) {
      console.log('\n   Recent deposits:')
      transactions.slice(0, 5).forEach((tx: any, index: number) => {
        console.log(`   ${index + 1}. ${tx.amount} ${tx.currency} - ${tx.status} - ${tx.description || 'No description'}`)
      })
    }
    
    return transactions
  } else {
    console.log('❌ Failed to get transaction history:', data)
    return null
  }
}

async function runTests() {
  const depositId = process.argv[2]

  if (!depositId) {
    console.log('❌ Please provide a deposit ID')
    console.log('Usage: npx tsx tests/test-phase2-payment.ts <depositId>')
    console.log('\nExample:')
    console.log('  1. First create a deposit: npx tsx tests/test-phase2-deposit.ts')
    console.log('  2. Send testnet Bitcoin to the address')
    console.log('  3. Then run: npx tsx tests/test-phase2-payment.ts <depositId>')
    console.log('\n⚠️  Note: You must use the SAME user account that created the deposit!')
    console.log('   The deposit test creates a new user each time.')
    console.log('   For testing, create a deposit and payment check in the same session.')
    process.exit(1)
  }

  console.log('🚀 Starting Phase 2 Payment Detection Tests...\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`Deposit ID: ${depositId}\n`)
  console.log('⚠️  Note: Make sure you\'re using the same user account that created this deposit!')
  console.log('   If you get "Unauthorized" or "Deposit not found", the deposit belongs to a different user.\n')

  // Step 1: Authenticate
  const authSuccess = await testLogin()
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Exiting.')
    process.exit(1)
  }

  // Step 2: Check payment status
  const paymentStatus = await testCheckPaymentStatus(depositId)
  
  // Step 3: Get full deposit details
  await testGetDepositStatus(depositId)

  // Step 4: Check wallet balance
  await testWalletBalance()

  // Step 5: Check transaction history
  await testTransactionHistory()

  console.log('\n✅ All payment detection tests completed!')
  
  if (paymentStatus?.hasPayment) {
    if (paymentStatus.confirmed) {
      console.log('\n🎉 Payment confirmed! Wallet should be credited.')
    } else {
      console.log('\n⏳ Payment detected but not yet confirmed. Wait for confirmations.')
    }
  } else {
    console.log('\n⚠️  No payment detected yet. Make sure you sent Bitcoin to the address.')
  }
}

runTests().catch(console.error)

