/**
 * lib/fraud-detection.ts — Phase 2A
 *
 * Matched-betting detection, abnormal win-rate detection, and linked-account checks.
 * All methods are non-blocking background checks — they flag but don't block in real-time.
 */

import { query, queryOne } from './db'
import { nanoid } from 'nanoid'

// ── Matched-Betting Detection ─────────────────────────────────────────────────

/**
 * Detect matched-betting: opposite sides of the same event bet across linked accounts.
 * Called after every sports bet is placed.
 */
export async function detectMatchedBetting(
  userId: string,
  matchId: string,
  selection: string  // e.g. '1', 'X', '2', 'home', 'away'
): Promise<{ flagged: boolean; linkedUserId?: string }> {
  // Find the opposite selection for this match
  const oppositeSelection = getOppositeSelection(selection)
  if (!oppositeSelection) return { flagged: false }

  // Find accounts linked to this user (same IP /24 block, payment method, or device)
  const linkedAccounts = await getLinkedAccounts(userId)
  if (linkedAccounts.length === 0) return { flagged: false }

  // Check if any linked account bet the opposite side of this match
  for (const linkedId of linkedAccounts) {
    const oppositeBet = await queryOne(
      `SELECT id FROM bets
       WHERE user_id = ? AND match_id = ? AND selection = ? AND status IN ('pending', 'won', 'lost')
       LIMIT 1`,
      [linkedId, matchId, oppositeSelection]
    )
    if (oppositeBet) {
      // Flag both accounts
      await flagSuspiciousLink(userId, linkedId, 'matched_betting', matchId)
      return { flagged: true, linkedUserId: linkedId }
    }
  }

  return { flagged: false }
}

function getOppositeSelection(selection: string): string | null {
  const opposites: Record<string, string> = {
    '1': '2', '2': '1',
    'home': 'away', 'away': 'home',
    'over': 'under', 'under': 'over',
  }
  return opposites[selection.toLowerCase()] ?? null
}

// ── Abnormal Win Rate Detection ───────────────────────────────────────────────

/**
 * Check if a user's win rate significantly exceeds statistical expectation.
 * Flags if win rate > 3σ above expected (based on average RTP of 96% for slots).
 * Only runs after ≥ 1,000 spins to ensure statistical significance.
 */
export async function detectAbnormalWinRate(userId: string): Promise<{
  flagged: boolean
  winRate?: number
  expectedRate?: number
}> {
  const stats = await queryOne<{ total: number; won: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won
     FROM bets WHERE user_id = ?`,
    [userId]
  )

  if (!stats || stats.total < 1000) return { flagged: false }

  const winRate = stats.won / stats.total
  const expectedRate = 0.49 // ~49% win rate expected for even-money bets
  const stdDev = Math.sqrt((expectedRate * (1 - expectedRate)) / stats.total)
  const zScore = (winRate - expectedRate) / stdDev

  if (zScore > 3) {
    await query(
      `INSERT OR IGNORE INTO suspicious_account_links
         (id, user_id_a, user_id_b, link_type, link_value)
       VALUES (?, ?, ?, 'device', ?)`,
      [nanoid(), userId, userId, `abnormal_win_rate:z=${zScore.toFixed(2)}`]
    )
    return { flagged: true, winRate, expectedRate }
  }

  return { flagged: false, winRate, expectedRate }
}

// ── Linked Account Detection ──────────────────────────────────────────────────

/**
 * Check if a new user shares identifiers with existing users.
 * Called on registration and first deposit.
 */
export async function checkAndRecordLinkedAccounts(
  userId: string,
  ipAddress: string | null,
  paymentMethodToken: string | null,
  deviceFingerprint: string | null
): Promise<void> {
  // Check IP /24 block
  if (ipAddress) {
    const ipBlock = ipAddress.split('.').slice(0, 3).join('.') + '.'
    const sameIpUsers = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM bonus_fingerprints
       WHERE ip_address LIKE ? AND user_id != ?`,
      [ipBlock + '%', userId]
    )
    for (const row of sameIpUsers.rows) {
      await recordLink(userId, row.user_id, 'ip', ipBlock)
    }
  }

  // Check payment method
  if (paymentMethodToken) {
    const samePaymentUsers = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM bonus_fingerprints
       WHERE fingerprint_hash = ? AND user_id != ?`,
      [paymentMethodToken, userId]
    )
    for (const row of samePaymentUsers.rows) {
      await recordLink(userId, row.user_id, 'payment_method', paymentMethodToken)
    }
  }
}

async function recordLink(
  userA: string,
  userB: string,
  linkType: string,
  linkValue: string
): Promise<void> {
  // Normalize order so A < B alphabetically (prevents duplicates)
  const [a, b] = [userA, userB].sort()
  await query(
    `INSERT OR IGNORE INTO suspicious_account_links
       (id, user_id_a, user_id_b, link_type, link_value)
     VALUES (?, ?, ?, ?, ?)`,
    [nanoid(), a, b, linkType, linkValue]
  )
}

async function flagSuspiciousLink(
  userA: string,
  userB: string,
  linkType: string,
  linkValue: string
): Promise<void> {
  const [a, b] = [userA, userB].sort()
  await query(
    `INSERT OR IGNORE INTO suspicious_account_links
       (id, user_id_a, user_id_b, link_type, link_value)
     VALUES (?, ?, ?, ?, ?)`,
    [nanoid(), a, b, linkType, linkValue]
  )
}

/**
 * Get all user IDs linked to this user.
 */
export async function getLinkedAccounts(userId: string): Promise<string[]> {
  const result = await query<{ user_id_a: string; user_id_b: string }>(
    `SELECT user_id_a, user_id_b FROM suspicious_account_links
     WHERE user_id_a = ? OR user_id_b = ?`,
    [userId, userId]
  )
  return result.rows
    .map(r => (r.user_id_a === userId ? r.user_id_b : r.user_id_a))
    .filter((id, i, arr) => arr.indexOf(id) === i)
}

/**
 * Check if a user has bonus eligibility frozen (has unreviewed suspicious links).
 */
export async function isBonusEligibilityFrozen(userId: string): Promise<boolean> {
  const link = await queryOne(
    `SELECT id FROM suspicious_account_links
     WHERE (user_id_a = ? OR user_id_b = ?) AND reviewed = 0
     LIMIT 1`,
    [userId, userId]
  )
  return !!link
}
