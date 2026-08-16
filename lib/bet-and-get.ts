/**
 * lib/bet-and-get.ts — Phase 2A
 *
 * Bet & Get: "Bet $25, Get $10 in Bonus Bets"
 * Trigger: settled single losing bet ≥ $25 at decimal odds ≥ 1.50
 * Reward: $10 bonus bet (stake not returned on win)
 * Anti-abuse: odds floor + one-time per verified user
 */

import { query, queryOne } from './db'
import { nanoid } from 'nanoid'

const MIN_STAKE = 25.00
const MIN_DECIMAL_ODDS = 1.50
const BONUS_AMOUNT = 10.00
const BONUS_EXPIRY_DAYS = 7

/**
 * Decimal odds equivalent of -200 American = 1.50
 * All positive American odds qualify (e.g. +100 = 2.00 decimal)
 * American -200 = 1.50 decimal (the floor)
 */
export function meetsOddsFloor(decimalOdds: number): boolean {
  return decimalOdds >= MIN_DECIMAL_ODDS
}

/**
 * Convert American odds to decimal (needed if bet stored in american format)
 */
export function americanToDecimal(american: number): number {
  if (american > 0) return (american / 100) + 1
  return (100 / Math.abs(american)) + 1
}

/**
 * Check if a user is eligible for Bet & Get after a bet settles.
 *
 * Eligibility criteria:
 * 1. Bet is a single (not parlay)
 * 2. Stake ≥ $25
 * 3. Decimal odds ≥ 1.50
 * 4. Bet was a loss
 * 5. User has not already claimed Bet & Get
 */
export async function checkBetAndGetEligibility(
  userId: string,
  betId: string
): Promise<{ eligible: boolean; reason?: string }> {
  // Look up the bet
  const bet = await queryOne<{
    id: string
    user_id: string
    amount: number
    odds: number
    status: string
    bet_type: string
    funded_by: string | null
  }>(
    `SELECT id, user_id, amount, odds, status, bet_type, funded_by FROM bets WHERE id = ? AND user_id = ?`,
    [betId, userId]
  )

  if (!bet) return { eligible: false, reason: 'Bet not found' }
  if (bet.status !== 'lost') return { eligible: false, reason: 'Bet must be a loss' }
  if (bet.bet_type !== 'single') return { eligible: false, reason: 'Only single bets qualify' }
  if (bet.funded_by === 'bonus') return { eligible: false, reason: 'Bonus-funded bets do not qualify' }
  if (bet.amount < MIN_STAKE) return { eligible: false, reason: `Minimum stake is $${MIN_STAKE}` }
  if (!meetsOddsFloor(bet.odds)) {
    return { eligible: false, reason: `Minimum odds are ${MIN_DECIMAL_ODDS} (decimal) / -200 (american)` }
  }

  // Check if user already claimed Bet & Get
  const existing = await queryOne(
    `SELECT id FROM user_bonuses WHERE user_id = ? AND bonus_type = 'bet_and_get' LIMIT 1`,
    [userId]
  )
  if (existing) return { eligible: false, reason: 'Bet & Get already claimed' }

  return { eligible: true }
}

/**
 * Award $10 bonus bet to a user.
 * Creates user_bonuses record and credits bonus_balance.
 */
export async function awardBetAndGet(userId: string): Promise<string> {
  const bonusId = nanoid()
  const expiresAt = new Date(Date.now() + BONUS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  // bonus_amount = 10, wagering = 1× (stake not returned — the $10 IS the single-use token)
  await query(
    `INSERT INTO user_bonuses
       (id, user_id, bonus_type, status, bonus_amount, wagering_requirement, wagering_progress, expires_at)
     VALUES (?, ?, 'bet_and_get', 'active', ?, ?, 0, ?)`,
    [bonusId, userId, BONUS_AMOUNT, BONUS_AMOUNT, expiresAt.toISOString()]
  )

  // Credit bonus_balance
  await query(
    `UPDATE wallets
     SET bonus_balance = COALESCE(bonus_balance, 0) + ?
     WHERE user_id = ?`,
    [BONUS_AMOUNT, userId]
  )

  return bonusId
}

/**
 * After a bonus-bet wins: credit winnings (only) to real balance.
 * The $10 stake is NOT returned — standard free-bet mechanic.
 */
export async function settleBonusBetWin(
  userId: string,
  bonusId: string,
  winnings: number // profit only (payout minus stake)
): Promise<void> {
  // Deduct the bonus bet from bonus_balance
  await query(
    `UPDATE wallets SET bonus_balance = COALESCE(bonus_balance,0) - ? WHERE user_id = ?`,
    [BONUS_AMOUNT, userId]
  )
  // Credit winnings to real balance
  await query(
    `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
    [winnings, userId]
  )
  // Mark bonus as completed
  await query(
    `UPDATE user_bonuses SET status = 'completed', completed_at = ? WHERE id = ?`,
    [new Date().toISOString(), bonusId]
  )
}
