import 'dotenv/config'
import crypto from 'crypto'

async function main() {
  const baseUrl = 'http://localhost:3000'
  const merchantId = 'dbb46701285c1a2e24a0bf92f00501e5'
  const merchantKey = 'b83d51ea35e2620a4e29913a9059e8e5038caa64'
  
  // Simulate what Slotegrator sends during self-validation
  const testCases = [
    { name: 'Balance check', body: { action: 'balance', player_id: 'normal_test_user_01', currency: 'EUR' } },
    { name: 'Balance (unknown player)', body: { action: 'balance', player_id: 'nonexistent_user_999', currency: 'EUR' } },
  ]

  for (const tc of testCases) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomBytes(16).toString('hex')
    
    const headers = {
      'X-Merchant-Id': merchantId,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    }
    
    // Calculate X-Sign (same as our callback validates)
    const merged: Record<string, string> = { ...tc.body, ...headers }
    const sortedKeys = Object.keys(merged).sort()
    const qs = sortedKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(merged[k]))}`).join('&')
    const xSign = crypto.createHmac('sha1', merchantKey).update(qs).digest('hex')
    
    // Build form body
    const formBody = Object.entries(tc.body).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    
    console.log(`\n--- ${tc.name} ---`)
    const res = await fetch(`${baseUrl}/api/casino/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Merchant-Id': merchantId,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Sign': xSign,
      },
      body: formBody,
    })
    
    const data = await res.json()
    console.log(`  HTTP ${res.status}:`, JSON.stringify(data))
    
    if (data.error_code) {
      console.log(`  (expected error: ${data.error_code})`)
    } else if (data.balance !== undefined) {
      console.log(`  Balance: ${data.balance}`)
    }
  }
}

main().catch(console.error)
