/**
 * Advanced Betting Limits System
 * 
 * Manages:
 * - Global betting limits
 * - Per-sport limits
 * - Per-market limits
 * - Per-user limits (VIP tiers)
 * - Dynamic limits based on risk
 * - Responsible gambling limits
 */

import { query, queryOne } from './db'

export interface BettingLimits {
  minBet: number
  maxBet: number
  maxPayout: number
  maxPendingBets: number
  dailyBetLimit?: number
  weeklyBetLimit?: number
  monthlyBetLimit?: number
}

export interface UserTier {
  name: string
  level: number
  limits: BettingLimits
  benefits: string[]
}

export const USER_TIERS: Record<string, UserTier> = {
  bronze: {
    name: 'Bronze',
    level: 1,
    limits: {
      minBet: 1,
      maxBet: 1000,
      maxPayout: 10000,
      maxPendingBets: 20,
      dailyBetLimit: 5000,
      weeklyBetLimit: 20000,
      monthlyBetLimit: 50000
    },
    benefits: ['Standard support', 'Basic analytics']
  },
  silver: {
    name: 'Silver',
    level: 2,
    limits: {
      minBet: 1,
      maxBet: 5000,
      maxPayout: 50000,
      maxPendingBets: 50,
      dailyBetLimit: 20000,
      weeklyBetLimit: 100000,
      monthlyBetLimit: 250000
    },
    benefits: ['Priority support', 'Advanced analytics', 'Faster withdrawals']
  },
  gold: {
    name: 'Gold',
    level: 3,
    limits: {
      minBet: 1,
      maxBet: 20000,
      maxPayout: 200000,
      maxPendingBets: 100,
      dailyBetLimit: 100000,
      weeklyBetLimit: 500000,
      monthlyBetLimit: 1500000
    },
    benefits: [
      'VIP support',
      'Premium analytics',
      'Instant withdrawals',
      'Personal account manager'
    ]
  },
  platinum: {
    name: 'Platinum',
    level: 4,
    limits: {
      minBet: 1,
      maxBet: 100000,
      maxPayout: 1000000,
      maxPendingBets: 200,
      dailyBetLimit: 500000,
      weeklyBetLimit: 2000000,
      monthlyBetLimit: 5000000
    },
    benefits: [
      'Dedicated VIP support',
      'Custom analytics',
      'Priority withdrawals',
      'Exclusive promotions',
      'Personal account manager'
    ]
  }
}

/**
 * Get betting limits for a user
 */
export async function getUserBettingLimits(userId: string): Promise<BettingLimits> {
  try {
    // Get user tier
    const user = await queryOne<{
      tier: string
      custom_limits: string | null
    }>(
      'SELECT tier, custom_limits FROM users WHERE id = ?',
      [userId]
    )

    if (!user) {
      // Return default limits
      return USER_TIERS.bronze.limits
    }

    // Check if user has custom limits
    if (user.custom_limits) {
      try {
        const customLimits = JSON.parse(user.custom_limits)
        return customLimits as BettingLimits
      } catch {
        console.error('Invalid custom limits JSON')
      }
    }

    // Return tier-based limits
    const tier = USER_TIERS[user.tier] || USER_TIERS.bronze
    return tier.limits
  } catch (error) {
    console.error('Error getting user betting limits:', error)
    return USER_TIERS.bronze.limits
  }
}

/**
 * Get sport-specific limits
 */
export async function getSportLimits(sportId: string): Promise<Partial<BettingLimits>> {
  try {
    const sport = await queryOne<{
      max_bet: number | null
      max_payout: number | null
    }>(
      'SELECT max_bet, max_payout FROM sports WHERE id = ?',
      [sportId]
    )

    if (!sport) {
      return {}
    }

    return {
      maxBet: sport.max_bet || undefined,
      maxPayout: sport.max_payout || undefined
    }
  } catch (error) {
    console.error('Error getting sport limits:', error)
    return {}
  }
}

/**
 * Get market-specific limits
 */
export async function getMarketLimits(marketId: string): Promise<Partial<BettingLimits>> {
  try {
    const market = await queryOne<{
      max_bet: number | null
      max_payout: number | null
    }>(
      'SELECT max_bet, max_payout FROM betting_markets WHERE id = ?',
      [marketId]
    )

    if (!market) {
      return {}
    }

    return {
      maxBet: market.max_bet || undefined,
      maxPayout: market.max_payout || undefined
    }
  } catch (error) {
    console.error('Error getting market limits:', error)
    return {}
  }
}

/**
 * Validate bet against all limits
 */
export async function validateBetLimits(
  userId: string,
  amount: number,
  potentialWin: number,
  sportId?: string,
  marketId?: string
): Promise<{
  valid: boolean
  errors: string[]
  limits: BettingLimits
}> {
  const errors: string[] = []

  // Get user limits
  const userLimits = await getUserBettingLimits(userId)

  // Check minimum bet
  if (amount < userLimits.minBet) {
    errors.push(`Minimum bet is ${userLimits.minBet} MAD`)
  }

  // Check maximum bet
  let maxBet = userLimits.maxBet
  if (sportId) {
    const sportLimits = await getSportLimits(sportId)
    if (sportLimits.maxBet && sportLimits.maxBet < maxBet) {
      maxBet = sportLimits.maxBet
    }
  }
  if (marketId) {
    const marketLimits = await getMarketLimits(marketId)
    if (marketLimits.maxBet && marketLimits.maxBet < maxBet) {
      maxBet = marketLimits.maxBet
    }
  }
  if (amount > maxBet) {
    errors.push(`Maximum bet is ${maxBet} MAD`)
  }

  // Check maximum payout
  let maxPayout = userLimits.maxPayout
  if (sportId) {
    const sportLimits = await getSportLimits(sportId)
    if (sportLimits.maxPayout && sportLimits.maxPayout < maxPayout) {
      maxPayout = sportLimits.maxPayout
    }
  }
  if (marketId) {
    const marketLimits = await getMarketLimits(marketId)
    if (marketLimits.maxPayout && marketLimits.maxPayout < maxPayout) {
      maxPayout = marketLimits.maxPayout
    }
  }
  if (potentialWin > maxPayout) {
    errors.push(`Maximum potential win is ${maxPayout} MAD`)
  }

  // Check pending bets limit
  const pendingCount = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_bets WHERE user_id = ? AND status = "pending"',
    [userId]
  )
  if (pendingCount && pendingCount.count >= userLimits.maxPendingBets) {
    errors.push(`Maximum ${userLimits.maxPendingBets} pending bets allowed`)
  }

  // Check daily limit
  if (userLimits.dailyBetLimit) {
    const todayTotal = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM user_bets 
       WHERE user_id = ? 
         AND DATE(created_at) = DATE(CURRENT_TIMESTAMP)`,
      [userId]
    )
    if (todayTotal && todayTotal.total + amount > userLimits.dailyBetLimit) {
      errors.push(`Daily betting limit is ${userLimits.dailyBetLimit} MAD`)
    }
  }

  // Check weekly limit
  if (userLimits.weeklyBetLimit) {
    const weekTotal = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM user_bets 
       WHERE user_id = ? 
         AND created_at >= DATE(CURRENT_TIMESTAMP, '-7 days')`,
      [userId]
    )
    if (weekTotal && weekTotal.total + amount > userLimits.weeklyBetLimit) {
      errors.push(`Weekly betting limit is ${userLimits.weeklyBetLimit} MAD`)
    }
  }

  // Check monthly limit
  if (userLimits.monthlyBetLimit) {
    const monthTotal = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM user_bets 
       WHERE user_id = ? 
         AND created_at >= DATE(CURRENT_TIMESTAMP, '-30 days')`,
      [userId]
    )
    if (monthTotal && monthTotal.total + amount > userLimits.monthlyBetLimit) {
      errors.push(`Monthly betting limit is ${userLimits.monthlyBetLimit} MAD`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    limits: userLimits
  }
}

/**
 * Set custom limits for a user (admin function)
 */
export async function setCustomUserLimits(
  userId: string,
  limits: Partial<BettingLimits>
): Promise<boolean> {
  try {
    const limitsJson = JSON.stringify(limits)
    await query(
      'UPDATE users SET custom_limits = ? WHERE id = ?',
      [limitsJson, userId]
    )
    return true
  } catch (error) {
    console.error('Error setting custom limits:', error)
    return false
  }
}

/**
 * Upgrade user tier
 */
export async function upgradeUserTier(
  userId: string,
  newTier: keyof typeof USER_TIERS
): Promise<boolean> {
  try {
    if (!USER_TIERS[newTier]) {
      throw new Error(`Invalid tier: ${newTier}`)
    }

    await query(
      'UPDATE users SET tier = ? WHERE id = ?',
      [newTier, userId]
    )
    return true
  } catch (error) {
    console.error('Error upgrading user tier:', error)
    return false
  }
}

/**
 * Calculate recommended tier based on user activity
 */
export async function calculateRecommendedTier(userId: string): Promise<string> {
  try {
    const stats = await queryOne<{
      total_wagered: number
      bet_count: number
      months_active: number
    }>(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_wagered,
        COUNT(*) as bet_count,
        CAST((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(MIN(created_at))) / 30 AS INTEGER) as months_active
       FROM user_bets 
       WHERE user_id = ?`,
      [userId]
    )

    if (!stats) {
      return 'bronze'
    }

    // Platinum: 500k+ wagered, 500+ bets, 6+ months
    if (
      stats.total_wagered >= 500000 &&
      stats.bet_count >= 500 &&
      stats.months_active >= 6
    ) {
      return 'platinum'
    }

    // Gold: 100k+ wagered, 200+ bets, 3+ months
    if (
      stats.total_wagered >= 100000 &&
      stats.bet_count >= 200 &&
      stats.months_active >= 3
    ) {
      return 'gold'
    }

    // Silver: 20k+ wagered, 50+ bets, 1+ month
    if (
      stats.total_wagered >= 20000 &&
      stats.bet_count >= 50 &&
      stats.months_active >= 1
    ) {
      return 'silver'
    }

    return 'bronze'
  } catch (error) {
    console.error('Error calculating recommended tier:', error)
    return 'bronze'
  }
}





