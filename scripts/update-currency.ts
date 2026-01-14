/**
 * Update existing users' currency from MAD to USD
 * Run: npx tsx scripts/update-currency.ts
 */

import { query } from '../lib/db'

async function updateCurrency() {
  try {
    console.log('🔄 Updating currency from MAD to USD...\n')
    
    // Check current state
    const beforeProfiles = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM user_profiles WHERE currency = 'MAD'"
    )
    const beforeWallets = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM wallets WHERE currency = 'MAD'"
    )
    
    console.log(`📊 Found ${beforeProfiles.rows[0].count} user profiles with MAD currency`)
    console.log(`📊 Found ${beforeWallets.rows[0].count} wallets with MAD currency\n`)
    
    if (beforeProfiles.rows[0].count === 0 && beforeWallets.rows[0].count === 0) {
      console.log('✅ No users with MAD currency found. Nothing to update!')
      return
    }
    
    // Update user profiles
    const profileResult = await query(
      "UPDATE user_profiles SET currency = 'USD' WHERE currency = 'MAD'"
    )
    console.log(`✅ Updated ${profileResult.rowCount} user profiles`)
    
    // Update wallets
    const walletResult = await query(
      "UPDATE wallets SET currency = 'USD' WHERE currency = 'MAD'"
    )
    console.log(`✅ Updated ${walletResult.rowCount} wallets\n`)
    
    // Verify
    const afterProfiles = await query<{ user_id: string; currency: string }>(
      "SELECT user_id, currency FROM user_profiles"
    )
    const afterWallets = await query<{ user_id: string; currency: string }>(
      "SELECT user_id, currency FROM wallets"
    )
    
    console.log('📊 Updated User Profiles:')
    if (afterProfiles.rows.length > 0) {
      console.table(afterProfiles.rows)
    } else {
      console.log('  (no profiles found)')
    }
    
    console.log('\n📊 Updated Wallets:')
    if (afterWallets.rows.length > 0) {
      console.table(afterWallets.rows)
    } else {
      console.log('  (no wallets found)')
    }
    
    console.log('\n✅ Currency update completed successfully!')
    console.log('💡 Make sure CASINO_DEFAULT_CURRENCY=USD is set in your .env file')
    console.log('💡 Restart your Next.js server for changes to take effect')
  } catch (error) {
    console.error('❌ Error updating currency:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

updateCurrency()


