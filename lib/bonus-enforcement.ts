/**
 * lib/bonus-enforcement.ts — Phase 2A
 *
 * Max-bet validation + wagering contribution tracking for active bonuses.
 * Called before every casino spin / sports bet while a bonus is active.
 */

import { query } from './db'
import { nanoid } from 'nanoid'
import { getActiveBonus, updateWageringProgress } from './bonus-db'

export type GameType = 'slot' | 'table' | 'sports'

/** Contribution rates per game type (as per bonus rules) */
const CONTRIBUTION_RATES: Record<GameType, number> = {
  slot: 1.0,    // 100% — slots count fully
  table: 0.0,   // 0%   — blackjack, roulette, poker excluded
  sports: 0.0,  // 0%   — sports bets excluded from casino wagering
}

/**
 * Validate a bet amount against the user's active welcome bonus.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function validateBetAgainstActiveBonus(
  userId: string,
  betAmount: number,
  gameType: GameType
): Promise<{ allowed: boolean; reason?: string }> {
  const activeBonus = await getActiveBonus(userId, 'welcome')
  if (!activeBonus) return { allowed: true }

  // Enforce max_bet_limit ($5.00 for welcome bonus)
  if (activeBonus.max_bet_limit !== null && betAmount > activeBonus.max_bet_limit) {
    return {
      allowed: false,
      reason: `Mise maximale pendant le bonus actif : ${activeBonus.max_bet_limit.toFixed(2)} €/$. Votre mise (${betAmount.toFixed(2)}) dépasse cette limite. Les gains seraient annulés.`,
    }
  }

  return { allowed: true }
}

/**
 * Record a wagering contribution for a settled bet/spin.
 * Called after every settled slot spin or sports bet while a bonus is active.
 *
 * @param userId        The user who placed the bet
 * @param betAmount     The gross wager amount
 * @param gameType      'slot' | 'table' | 'sports'
 * @param betId         Optional bet UUID (for sports)
 * @param gameSessionId Optional Slotegrator session ID (for casino)
 */
export async function recordWageringContribution(
  userId: string,
  betAmount: number,
  gameType: GameType,
  betId?: string,
  gameSessionId?: string
): Promise<void> {
  const activeBonus = await getActiveBonus(userId)
  if (!activeBonus) return

  const rate = CONTRIBUTION_RATES[gameType]
  const contribution = betAmount * rate

  // Insert contribution record
  await query(
    `INSERT INTO bonus_wagering_contributions
       (id, user_bonus_id, bet_id, game_session_id, game_type, bet_amount, contribution_rate, contribution_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nanoid(), activeBonus.id, betId ?? null, gameSessionId ?? null, gameType, betAmount, rate, contribution]
  )

  // Update bonus progress (and auto-complete if threshold reached)
  if (contribution > 0) {
    await updateWageringProgress(activeBonus.id, contribution)
  }
}

/**
 * Get active bonus details formatted for UI display.
 */
export async function getActiveBonusSummary(userId: string): Promise<{
  hasBonus: boolean
  bonusType?: string
  bonusAmount?: number
  progress?: number
  requirement?: number
  progressPct?: number
  maxBet?: number | null
  expiresAt?: string
} | null> {
  const bonus = await getActiveBonus(userId)
  if (!bonus) return { hasBonus: false }

  const progressPct = bonus.wagering_requirement > 0
    ? Math.min(100, (bonus.wagering_progress / bonus.wagering_requirement) * 100)
    : 100

  return {
    hasBonus: true,
    bonusType: bonus.bonus_type,
    bonusAmount: bonus.bonus_amount,
    progress: bonus.wagering_progress,
    requirement: bonus.wagering_requirement,
    progressPct: Math.round(progressPct),
    maxBet: bonus.max_bet_limit,
    expiresAt: bonus.expires_at,
  }
}
