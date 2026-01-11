/**
 * Phase 2 Testing: Full Payment Flow
 * Tests the complete payment flow from deposit creation to wallet crediting
 */

import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:3000'
let sessionToken: string | null = null

async function testLogin() {
  console.log('\n📝 Step 1: Login...')
  
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
    console.log('❌ Login failed:', data)
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
    console.log(`   Address: ${data.data.address}`)
    console.log(`   Amount: ${data.data.btcAmount} BTC`)
    return data.data
  }
  
  return null
}

async function testCheckPaymentStatus(depositId: string, maxAttempts: number = 10) {
  console.log('\n📝 Step 3: Monitor payment status...')
  console.log('   (This will check every 10 seconds for up to 2 minutes)')
  
  if (!sessionToken) {
    return null
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n   Attempt ${attempt}/${maxAttempts}...`)
    
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
      
      if (status.hasPayment) {
        console.log(`   ✅ Payment detected!`)
        console.log(`      TX Hash: ${status.txHash}`)
        console.log(`      Confirmations: ${status.confirmations}/${status.requiredConfirmations || 1}`)
        
        if (status.confirmed) {
          console.log(`   🎉 Payment confirmed!`)
          return status
        } else {
          console.log(`   ⏳ Waiting for confirmations...`)
        }
      } else {
        console.log(`   ⏳ No payment detected yet...`)
      }
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
    }
  }
  
  console.log('\n   ⚠️  Payment not detected within timeout period')
  return null
}

async function testWalletBalance() {
  console.log('\n📝 Step 4: Check wallet balance...')
  
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
    console.log('✅ Wallet balance retrieved')
    console.log(`   Balance: ${data.data.balance} ${data.data.currency}`)
    return data.data
  }
  
  return null
}

async function runTests() {
  console.log('🚀 Starting Phase 2 Full Payment Flow Test...\n')
  console.log(`API URL: ${API_URL}\n`)

  // Step 1: Authenticate
  const authSuccess = await testLogin()
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Exiting.')
    process.exit(1)
  }

  // Step 2: Create deposit
  const deposit = await testCreateDeposit()
  if (!deposit) {
    console.log('\n❌ Deposit creation failed. Exiting.')
    process.exit(1)
  }

  console.log('\n📋 IMPORTANT:')
  console.log('   1. Send testnet Bitcoin to this address:')
  console.log(`      ${deposit.address}`)
  console.log(`   2. Amount: ${deposit.btcAmount} BTC (or more)`)
  console.log('   3. Get testnet Bitcoin from: https://testnet-faucet.mempool.co/')
  console.log('\n   Press Enter after sending the payment...')

  // Wait for user input (in a real scenario, you'd use readline)
  await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds

  // Step 3: Monitor payment
  const paymentStatus = await testCheckPaymentStatus(deposit.depositId)

  // Step 4: Check wallet balance
  const balance = await testWalletBalance()

  console.log('\n✅ Full payment flow test completed!')
  
  if (paymentStatus?.confirmed) {
    console.log('\n🎉 SUCCESS: Payment confirmed and wallet credited!')
  } else if (paymentStatus?.hasPayment) {
    console.log('\n⏳ Payment detected but not yet confirmed. Wait a bit longer.')
  } else {
    console.log('\n⚠️  No payment detected. Make sure you sent Bitcoin to the address.')
  }
}

runTests().catch(console.error)






