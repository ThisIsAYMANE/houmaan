/**
 * Phase 2 Testing: Deposit Creation
 * Tests the deposit creation API endpoint
 */

import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:3000'
let sessionToken: string | null = null
let testUserId: string | null = null

async function testRegister() {
  console.log('\n📝 Step 1: Register test user...')
  
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
    testUserId = data.data.user.id
    console.log('✅ User registered successfully')
    console.log(`   User ID: ${testUserId}`)
    return true
  } else {
    console.log('❌ Registration failed:', data)
    return false
  }
}

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
    testUserId = data.data.user.id
    console.log('✅ Login successful')
    console.log(`   User ID: ${testUserId}`)
    return true
  } else {
    console.log('⚠️  Login failed, trying registration...')
    return await testRegister()
  }
}

async function testCreateDeposit() {
  console.log('\n📝 Step 2: Create Bitcoin deposit...')
  
  if (!sessionToken) {
    console.log('❌ No session token available')
    return null
  }

  const depositData = {
    amount: 100,
    currency: 'MAD',
    network: 'testnet' as const,
  }

  const response = await fetch(`${API_URL}/api/payments/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(depositData),
  })

  const data = await response.json()
  
  if (data.success && data.data) {
    console.log('✅ Deposit created successfully')
    console.log(`   Deposit ID: ${data.data.depositId}`)
    console.log(`   Address: ${data.data.address}`)
    console.log(`   Amount: ${data.data.amount} ${data.data.currency}`)
    console.log(`   BTC Amount: ${data.data.btcAmount} BTC`)
    console.log(`   Network: ${data.data.network}`)
    console.log(`   Required Confirmations: ${data.data.requiredConfirmations}`)
    console.log(`   Expires At: ${data.data.expiresAt}`)
    console.log(`   QR Code: ${data.data.qrCode ? 'Generated ✅' : 'Missing ❌'}`)
    console.log(`   Payment URL: ${data.data.paymentURL}`)
    
    return data.data
  } else {
    console.log('❌ Deposit creation failed:', data)
    return null
  }
}

async function testGetDepositStatus(depositId: string) {
  console.log('\n📝 Step 3: Get deposit status...')
  
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
    console.log('✅ Deposit status retrieved')
    console.log(`   Status: ${data.data.status}`)
    console.log(`   Confirmations: ${data.data.confirmations}/${data.data.requiredConfirmations}`)
    console.log(`   TX Hash: ${data.data.txHash || 'Not yet'}`)
    return data.data
  } else {
    console.log('❌ Failed to get deposit status:', data)
    return null
  }
}

async function testExchangeRates() {
  console.log('\n📝 Step 4: Test exchange rate conversion...')
  
  if (!sessionToken) {
    console.log('❌ No session token available')
    return
  }

  const testCases = [
    { amount: 100, currency: 'MAD' },
    { amount: 50, currency: 'USD' },
    { amount: 0.001, currency: 'BTC' },
  ]

  for (const testCase of testCases) {
    const response = await fetch(`${API_URL}/api/payments/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        ...testCase,
        network: 'testnet',
      }),
    })

    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ ${testCase.amount} ${testCase.currency} = ${data.data.btcAmount} BTC`)
    } else {
      console.log(`❌ Failed for ${testCase.amount} ${testCase.currency}:`, data.error)
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Phase 2 Deposit Tests...\n')
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

  // Step 3: Get deposit status
  await testGetDepositStatus(deposit.depositId)

  // Step 4: Test exchange rates
  await testExchangeRates()

  console.log('\n✅ All deposit tests completed!')
  console.log('\n📋 Next Steps:')
  console.log('   1. Send testnet Bitcoin to the address above')
  console.log('   2. Run: npx tsx tests/test-phase2-payment.ts')
  console.log('   3. Check payment detection and confirmation')
}

runTests().catch(console.error)




