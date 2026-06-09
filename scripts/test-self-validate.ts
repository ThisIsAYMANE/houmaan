/**
 * Self-validation test using the project's own casino-api.ts functions
 * which correctly call Slotegrator's /self-validate without extra params.
 */
import 'dotenv/config'
import { selfValidate, initializeSelfValidationSession, getGames, getMerchantLimits } from '../lib/casino-api'
import { query } from '../lib/db'
import * as fs from 'fs'

async function main() {
  console.log('=== Slotegrator Self-Validation Test ===\n')

  // 1. Get a game UUID from an enabled provider
  console.log('Step 1: Fetching games...')
  const limits = await getMerchantLimits()
  const eurLimit = limits.find((l: any) => l.currency === 'EUR')
  const enabledProviders = eurLimit?.providers || []
  console.log(`  Enabled providers for EUR: ${enabledProviders.length}`)

  const games = await getGames({ fetchAll: false, maxPages: 3 })
  console.log(`  Found ${games.items.length} games`)

  // Find a game from an enabled provider - prefer the known working UUID
  const knownWorkingUuid = 'fe38b9de0f44ac5892261d426ba39cd1aa410807'
  let game = games.items.find(g => g.uuid === knownWorkingUuid)
  if (!game) {
    game = games.items.find(g => enabledProviders.includes(g.provider))
  }
  if (!game) {
    console.error('  No game found from enabled providers')
    return
  }
  console.log(`  Selected: "${game.name}" (${game.provider}, uuid: ${game.uuid})`)

  // 2. Use normal test user for DB-backed callback path (not the bot)
  console.log('\nStep 2: Setting up normal test user...')
  const userId = 'normal_test_user_01'
  // Ensure user, profile, and wallet exist in DB
  await query(
    'INSERT OR IGNORE INTO users (id, email, password_hash, username) VALUES (?, ?, ?, ?)',
    [userId, 'normal_test@test.com', '$2a$10$placeholderhash123', 'NormalTestPlayer']
  )
  await query(
    'INSERT OR IGNORE INTO user_profiles (user_id, currency, language) VALUES (?, ?, ?)',
    [userId, 'EUR', 'en']
  )
  await query(
    'INSERT OR IGNORE INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)',
    [userId, 'EUR', 10000]
  )
  console.log(`  User: ${userId}, wallet: 10000 EUR`)

  // 3. Initialize game session via /games/init
  console.log('\nStep 3: Launching game session...')
  let sessionId = ''
  try {
    const session = await initializeSelfValidationSession(game.uuid, userId, 10000, {
      currency: 'EUR',
      playerName: 'TestPlayer',
      language: 'en',
      device: 'desktop',
    })
    sessionId = session.sessionId
    console.log(`  Session created: ${sessionId}`)
    console.log(`  Game URL: ${session.gameUrl.substring(0, 80)}...`)
    console.log(`  Expires: ${session.expiresAt}`)
  } catch (e: any) {
    console.error(`  Game init failed: ${e.message}`)
    return
  }

  // 4. Wait (Slotegrator recommends not touching the game)
  console.log('\nStep 4: Waiting 15 seconds (do NOT interact with the game)...')
  await new Promise(r => setTimeout(r, 15000))

  // 5. Call self-validate (no params, uses active session)
  console.log('\nStep 5: Calling /self-validate...')
  const result = await selfValidate()
  console.log(`  Result: success=${result.success}, status=${(result as any).status}`)

  // 6. Write output
  const output = {
    timestamp: new Date().toISOString(),
    gameUuid: game.uuid,
    gameName: game.name,
    provider: game.provider,
    sessionId,
    result,
  }

  fs.writeFileSync('logs_test', JSON.stringify(output, null, 2))
  console.log('\n=== Result written to logs_test ===')
  console.log(JSON.stringify(result, null, 2))

  if (result.success && (result as any).status === 1) {
    console.log('\n✅ SELF-VALIDATION PASSED!')
  } else {
    console.log('\n❌ Self-validation did not pass. Check logs_test for details.')
    if (result.log && result.log.length > 0) {
      console.log(`\nLog entries: ${result.log.length}`)
      result.log.forEach((line: string, i: number) => {
        const isFailed = line.toLowerCase().includes('failed')
        console.log(`  ${isFailed ? '❌' : ' '} [${i + 1}] ${line}`)
      })
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  fs.writeFileSync('logs_test', JSON.stringify({ error: String(err), stack: (err as any).stack }, null, 2))
  process.exit(1)
})
