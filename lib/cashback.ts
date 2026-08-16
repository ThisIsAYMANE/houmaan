/**
 * lib/cashback.ts — Phase 2A
 *
 * Weekly Cashback: 10% of net real-money losses, capped at $150, 5× wagering, 72h expiry.
 * Credited every Monday 00:00 UTC via /api/cron/weekly-cashback.
 */

import { query, queryOne } from './db'
import { nanoid } from 'nanoid'

const CASHBACK_RATE = 0.10
const CASHBACK_CAP = 150.00
const CASHBACK_WAGERING_MULTIPLIER = 5
const CASHBACK_EXPIRY_HOURS = 72

/**
 * Calculate the cashback amount for a user for a given week.
 * Only counts real-money bets (funded_by = 'real').
 *
 * @returns cashback amount (0 if user was profitable)
 */
export async function calculateWeeklyCashback(
  userId: string,
  weekStart: string, // ISO date string, e.g. "2026-07-28T00:00:00Z"
  weekEnd: string    // ISO date string, e.g. "2026-08-04T00:00:00Z"
): Promise<number> {
  // Sum of real-money losing bets
  const lossResult = await queryOne<{ total_lost: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_lost
     FROM bets
     WHERE user_id = ?
       AND status = 'lost'
       AND funded_by = 'real'
       AND settled_at >= ? AND settled_at < ?`,
    [userId, weekStart, weekEnd]
  )

  // Sum of real-money winning payouts
  const winResult = await queryOne<{ total_won: number }>(
    `SELECT COALESCE(SUM(potential_win), 0) AS total_won
     FROM bets
     WHERE user_id = ?
       AND status = 'won'
       AND funded_by = 'real'
       AND settled_at >= ? AND settled_at < ?`,
    [userId, weekStart, weekEnd]
  )

  const totalLost = lossResult?.total_lost ?? 0
  const totalWon = winResult?.total_won ?? 0
  const netLoss = totalLost - totalWon

  if (netLoss <= 0) return 0

  const cashback = Math.min(netLoss * CASHBACK_RATE, CASHBACK_CAP)
  return Math.round(cashback * 100) / 100
}

/**
 * Credit a weekly cashback bonus to a user.
 * Creates a user_bonuses record and credits bonus_balance in the wallet.
 */
export async function creditWeeklyCashback(
  userId: string,
  amount: number
): Promise<string> {
  if (amount <= 0) throw new Error('Cashback amount must be positive')

  const bonusId = nanoid()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CASHBACK_EXPIRY_HOURS * 60 * 60 * 1000)

  await query(
    `INSERT INTO user_bonuses
       (id, user_id, bonus_type, status, bonus_amount, wagering_requirement, wagering_progress, expires_at)
     VALUES (?, ?, 'cashback', 'active', ?, ?, 0, ?)`,
    [bonusId, userId, amount, amount * CASHBACK_WAGERING_MULTIPLIER, expiresAt.toISOString()]
  )

  // Credit bonus_balance in wallet
  await query(
    `UPDATE wallets
     SET bonus_balance = COALESCE(bonus_balance, 0) + ?
     WHERE user_id = ?`,
    [amount, userId]
  )

  return bonusId
}

/**
 * Get all users who had real-money betting activity in the given week.
 * Used by the cron job to iterate eligible users.
 */
export async function getEligibleUsersForCashback(
  weekStart: string,
  weekEnd: string
): Promise<string[]> {
  const result = await query<{ user_id: string }>(
    `SELECT DISTINCT user_id
     FROM bets
     WHERE funded_by = 'real'
       AND settled_at >= ? AND settled_at < ?`,
    [weekStart, weekEnd]
  )
  return result.rows.map(r => r.user_id)
}

/**
 * Calculate the start of the previous Monday (UTC).
 * Used by the cron job to determine the week window.
 */
export function getPreviousWeekWindow(): { weekStart: string; weekEnd: string } {
  const now = new Date()
  // This Monday 00:00 UTC
  const thisMonday = new Date(now)
  const dayOfWeek = now.getUTCDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  thisMonday.setUTCDate(now.getUTCDate() - daysToMonday)
  thisMonday.setUTCHours(0, 0, 0, 0)

  // Previous Monday
  const lastMonday = new Date(thisMonday)
  lastMonday.setUTCDate(thisMonday.getUTCDate() - 7)

  return {
    weekStart: lastMonday.toISOString(),
    weekEnd: thisMonday.toISOString(),
  }
}
