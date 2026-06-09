/**
 * Manual API testing script
 * Run with: npx tsx tests/test-api-manual.ts
 * 
 * This script tests the API endpoints manually
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: any
}

async function testAPI(name: string, url: string, options: RequestInit = {}): Promise<TestResult> {
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    
    return {
      name,
      passed: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : `Status ${response.status}: ${data.error?.message || JSON.stringify(data)}`,
    }
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function runAPITests() {
  console.log('🧪 Starting Phase 1 API Tests...\n')
  console.log(`Testing API at: ${BASE_URL}\n`)

  const results: TestResult[] = []

  // Test 1: Register a test user
  console.log('📝 Test 1: Registering test user...')
  const testEmail = `test${Date.now()}@example.com`
  const registerResult = await testAPI(
    'User Registration',
    `${BASE_URL}/api/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        username: `testuser${Date.now()}`,
      }),
    }
  )
  results.push(registerResult)
  console.log(registerResult.passed ? '✅' : '❌', registerResult.name)
  if (!registerResult.passed) {
    console.log('Error:', registerResult.error)
  }
  console.log()

  if (!registerResult.passed) {
    console.log('❌ Cannot continue - user registration failed')
    return
  }

  // Test 2: Login
  console.log('🔐 Test 2: Logging in...')
  const loginResult = await testAPI(
    'User Login',
    `${BASE_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
      }),
    }
  )
  results.push(loginResult)
  console.log(loginResult.passed ? '✅' : '❌', loginResult.name)
  if (!loginResult.passed) {
    console.log('Error:', loginResult.error)
    console.log('❌ Cannot continue - login failed')
    return
  }

  const sessionToken = loginResult.data?.data?.sessionToken
  if (!sessionToken) {
    console.log('❌ No session token received')
    return
  }
  console.log('Session token received:', sessionToken.substring(0, 20) + '...')
  console.log()

  // Test 3: Get wallet balance (without auth - should fail)
  console.log('🔒 Test 3: Testing authentication requirement...')
  const noAuthResult = await testAPI(
    'Get Balance (No Auth)',
    `${BASE_URL}/api/wallet/balance`
  )
  // This should FAIL (return 401), so passed=false means security is working
    const securityWorking = !noAuthResult.passed && (noAuthResult.error?.includes('401') ?? false)
  results.push({
    name: 'Get Balance (No Auth)',
    passed: securityWorking,
    error: securityWorking ? undefined : 'Should return 401 but got different response',
  })
  console.log(securityWorking ? '✅' : '❌', 'Should fail without auth:', securityWorking ? 'PASSED' : 'FAILED')
  if (!securityWorking) {
    console.log('⚠️  Security issue: API should return 401 without authentication')
  }
  console.log()

  // Test 4: Get wallet balance (with auth)
  console.log('💰 Test 4: Getting wallet balance...')
  const balanceResult = await testAPI(
    'Get Wallet Balance',
    `${BASE_URL}/api/wallet/balance`,
    {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    }
  )
  results.push(balanceResult)
  console.log(balanceResult.passed ? '✅' : '❌', balanceResult.name)
  if (balanceResult.passed) {
    console.log('Balance:', balanceResult.data?.data)
    if (balanceResult.data?.data?.balance === 0) {
      console.log('✅ Initial balance is 0 as expected')
    }
  } else {
    console.log('Error:', balanceResult.error)
  }
  console.log()

  // Test 5: Get transaction history
  console.log('📜 Test 5: Getting transaction history...')
  const historyResult = await testAPI(
    'Get Transaction History',
    `${BASE_URL}/api/wallet/transactions?limit=10&offset=0`,
    {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    }
  )
  results.push(historyResult)
  console.log(historyResult.passed ? '✅' : '❌', historyResult.name)
  if (historyResult.passed) {
    console.log('Transactions:', historyResult.data?.data)
    if (historyResult.data?.data?.transactions?.length === 0) {
      console.log('✅ Empty transaction history as expected for new user')
    }
  } else {
    console.log('Error:', historyResult.error)
  }
  console.log()

  // Test 6: Check security headers
  console.log('🔒 Test 6: Checking security headers...')
  const headersResponse = await fetch(`${BASE_URL}/api/wallet/balance`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
    },
  })
  const securityHeaders = {
    'X-Content-Type-Options': headersResponse.headers.get('X-Content-Type-Options'),
    'X-Frame-Options': headersResponse.headers.get('X-Frame-Options'),
    'X-XSS-Protection': headersResponse.headers.get('X-XSS-Protection'),
    'Content-Security-Policy': headersResponse.headers.get('Content-Security-Policy'),
  }
  console.log('Security Headers:', securityHeaders)
  const hasSecurityHeaders = Object.values(securityHeaders).some((val) => val !== null)
  results.push({
    name: 'Security Headers',
    passed: hasSecurityHeaders,
    data: securityHeaders,
  })
  console.log(hasSecurityHeaders ? '✅' : '❌', 'Security headers present')
  console.log()

  // Test 7: Test rate limiting (make many requests)
  console.log('⏱️  Test 7: Testing rate limiting...')
  let rateLimitHit = false
  for (let i = 0; i < 105; i++) {
    const response = await fetch(`${BASE_URL}/api/wallet/balance`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    })
    if (response.status === 429) {
      rateLimitHit = true
      console.log(`✅ Rate limit hit at request ${i + 1}`)
      break
    }
    if (i % 20 === 0) {
      process.stdout.write(`Made ${i + 1} requests...\r`)
    }
  }
  results.push({
    name: 'Rate Limiting',
    passed: rateLimitHit,
    data: { rateLimitHit },
  })
  if (!rateLimitHit) {
    console.log('⚠️  Rate limit not hit after 105 requests (might need to wait for window reset)')
  }
  console.log()

  // Summary
  console.log('\n📊 Test Summary:')
  console.log('='.repeat(50))
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  results.forEach((result) => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`)
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  console.log('='.repeat(50))
  console.log(`\n✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)

  if (passed === total) {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed')
    process.exit(1)
  }
}

// Run tests
runAPITests().catch((error) => {
  console.error('❌ Test runner error:', error)
  process.exit(1)
})

