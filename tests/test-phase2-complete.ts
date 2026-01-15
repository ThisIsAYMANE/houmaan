/**
 * Phase 2 Testing: Complete Flow
 * Creates deposit, shows address, then monitors for payment
 * This ensures the same user is used throughout
 */

import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:3000'
let sessionToken: string | null = null

async function testRegister() {
  console.log('\n📝 Step 1: Register test user...')
  
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test-phase2-complete-${Date.now()}@example.com`,
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

async function testCreateDeposit() {
  console.log('\n📝 Step 2: Create Bitcoin deposit...')
  
  if (!sessionToken) {
    return null
  }

  const response = await fetch(`${API_URL}/api/payments/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      amount: 100,
      currency: 'MAD',
      network: 'testnet',
    }),
  })

  const data = await response.json()
  
  if (data.success && data.data) {
    console.log('✅ Deposit created')
    console.log(`   Deposit ID: ${data.data.depositId}`)
    console.log(`   Address: ${data.data.address}`)
    console.log(`   Amount: ${data.data.btcAmount} BTC`)
    console.log(`   Payment URL: ${data.data.paymentURL}`)
    return data.data
  }
  
  return null
}

async function testCheckPaymentStatus(depositId: string) {
  if (!sessionToken) {
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
    return data.data
  }
  
  return null
}

async function testWalletBalance() {
  if (!sessionToken) {
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
    return data.data
  }
  
  return null
}

async function runTests() {
  console.log('🚀 Starting Phase 2 Complete Flow Test...\n')
  console.log(`API URL: ${API_URL}\n`)

  // Step 1: Register
  const authSuccess = await testRegister()
  if (!authSuccess) {
    console.log('\n❌ Registration failed. Exiting.')
    process.exit(1)
  }

  // Step 2: Create deposit
  const deposit = await testCreateDeposit()
  if (!deposit) {
    console.log('\n❌ Deposit creation failed. Exiting.')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 IMPORTANT: Send Testnet Bitcoin')
  console.log('='.repeat(60))
  console.log(`\n1. Go to: https://testnet-faucet.mempool.co/`)
  console.log(`2. Get testnet Bitcoin`)
  console.log(`3. Send to this address:`)
  console.log(`   ${deposit.address}`)
  console.log(`4. Amount: ${deposit.btcAmount} BTC (or more)`)
  console.log(`\n5. After sending, press Enter to continue monitoring...`)
  console.log('='.repeat(60))

  // Wait for user input (simulate with timeout for automated testing)
  console.log('\n⏳ Waiting 30 seconds for you to send Bitcoin...')
  await new Promise(resolve => setTimeout(resolve, 30000))

  // Step 3: Monitor payment
  console.log('\n📝 Step 3: Monitoring payment status...')
  let attempts = 0
  const maxAttempts = 12 // 2 minutes (10 seconds each)

  while (attempts < maxAttempts) {
    attempts++
    console.log(`\n   Check ${attempts}/${maxAttempts}...`)
    
    const status = await testCheckPaymentStatus(deposit.depositId)
    
    if (status) {
      if (status.hasPayment) {
        console.log(`   ✅ Payment detected!`)
        console.log(`      TX Hash: ${status.txHash}`)
        console.log(`      Confirmations: ${status.confirmations}/${status.requiredConfirmations || 1}`)
        
        if (status.confirmed) {
          console.log(`   🎉 Payment confirmed!`)
          break
        } else {
          console.log(`   ⏳ Waiting for confirmations...`)
        }
      } else {
        console.log(`   ⏳ No payment detected yet...`)
      }
    }
    
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
    }
  }

  // Step 4: Check wallet balance
  console.log('\n📝 Step 4: Check wallet balance...')
  const balance = await testWalletBalance()
  if (balance) {
    console.log(`   Balance: ${balance.balance} ${balance.currency}`)
    if (balance.balance > 0) {
      console.log(`   ✅ Wallet credited successfully!`)
    } else {
      console.log(`   ⚠️  Wallet not yet credited (payment may still be processing)`)
    }
  }

  console.log('\n✅ Complete flow test finished!')
  console.log('\n💡 Tip: Run this script again with the same deposit ID to check status:')
  console.log(`   npm run test:phase2:payment ${deposit.depositId}`)
}

runTests().catch(console.error)








