/**
 * Cash-Out Feature
 * 
 * Allows users to settle bets before match completion
 * Calculates fair cash-out value based on:
 * - Current odds
 * - Original odds
 * - Time remaining
 * - Bet status
 */

import { query, queryOne } from './db'

export interface CashOutCalculation {
  available: boolean
  cashOutValue: number
  originalStake: number
  potentialWin: number
  percentageOfPotentialWin: number
  reason?: string
}

export interface BetForCashOut {
  id: string
  userId: string
  betType: string
  amount: number
  potentialWin: number
  status: string
  selections: Array<{
    matchId: string
    marketId: string
    oddsId: string
    selection: string
    originalOdds: number
    currentOdds: number
    matchStatus: string
    isLive: boolean
  }>
}

/**
 * Calculate cash-out value for a bet
 * 
 * Formula: 
 * - For single bet: (stake * current_odds) / original_odds
 * - For accumulator: stake * (product of current_odds / product of original_odds)
 * - Apply time-based multiplier
 * - Apply margin (house edge)
 */
export async function calculateCashOut(betId: string): Promise<CashOutCalculation> {
  try {
    // Get bet details
    const bet = await queryOne<{
      id: string
      user_id: string
      bet_type: string
      amount: number
      odds: number
      potential_win: number
      status: string
    }>(
      'SELECT id, user_id, bet_type, amount, odds, potential_win, status FROM user_bets WHERE id = ?',
      [betId]
    )

    if (!bet) {
      return {
        available: false,
        cashOutValue: 0,
        originalStake: 0,
        potentialWin: 0,
        percentageOfPotentialWin: 0,
        reason: 'Bet not found'
      }
    }

    // Check if bet is eligible for cash-out
    if (bet.status !== 'pending') {
      return {
        available: false,
        cashOutValue: 0,
        originalStake: bet.amount,
        potentialWin: bet.potential_win,
        percentageOfPotentialWin: 0,
        reason: `Bet is ${bet.status}`
      }
    }

    // Get bet selections with current odds
    const selections = await query(
      `SELECT 
        bs.match_id,
        bs.market_id,
        bs.odds_id,
        bs.selection,
        bs.odds as original_odds,
        o.odds_value as current_odds,
        m.status as match_status,
        m.is_live
      FROM bet_selections bs
      LEFT JOIN odds o ON bs.odds_id = o.id
      LEFT JOIN matches m ON bs.match_id = m.id
      WHERE bs.bet_id = ?`,
      [betId]
    )

    if (selections.rows.length === 0) {
      return {
        available: false,
        cashOutValue: 0,
        originalStake: bet.amount,
        potentialWin: bet.potential_win,
        percentageOfPotentialWin: 0,
        reason: 'No selections found'
      }
    }

    // Check if any match has finished
    for (const sel of selections.rows) {
      if (sel.match_status === 'finished' || sel.match_status === 'cancelled') {
        return {
          available: false,
          cashOutValue: 0,
          originalStake: bet.amount,
          potentialWin: bet.potential_win,
          percentageOfPotentialWin: 0,
          reason: 'Match already finished'
        }
      }

      // Check if odds are available
      if (!sel.current_odds) {
        return {
          available: false,
          cashOutValue: 0,
          originalStake: bet.amount,
          potentialWin: bet.potential_win,
          percentageOfPotentialWin: 0,
          reason: 'Current odds not available'
        }
      }
    }

    // Calculate cash-out value
    let cashOutValue: number

    if (bet.bet_type === 'single') {
      const sel = selections.rows[0]
      // Simple ratio: stake * (current_odds / original_odds)
      const ratio = sel.current_odds / sel.original_odds
      cashOutValue = bet.amount * ratio
    } else {
      // Accumulator or system bet
      const originalOddsProduct = selections.rows.reduce(
        (acc: number, sel: any) => acc * sel.original_odds,
        1
      )
      const currentOddsProduct = selections.rows.reduce(
        (acc: number, sel: any) => acc * sel.current_odds,
        1
      )
      
      const ratio = currentOddsProduct / originalOddsProduct
      cashOutValue = bet.amount * ratio
    }

    // Apply margin (house takes a cut, typically 5-10%)
    const CASHOUT_MARGIN = 0.10 // 10% margin
    cashOutValue = cashOutValue * (1 - CASHOUT_MARGIN)

    // Apply time-based adjustment (less favorable as match progresses)
    const liveSelections = selections.rows.filter((s: any) => s.is_live)
    if (liveSelections.length > 0) {
      // Reduce cash-out value by 5% for live matches (more risk)
      cashOutValue = cashOutValue * 0.95
    }

    // Ensure minimum cash-out (at least return stake if odds improved significantly)
    cashOutValue = Math.max(cashOutValue, bet.amount * 0.5)

    // Ensure maximum cash-out (can't exceed potential win)
    cashOutValue = Math.min(cashOutValue, bet.potential_win * 0.95)

    // Round to 2 decimals
    cashOutValue = Math.round(cashOutValue * 100) / 100

    const percentageOfPotentialWin = (cashOutValue / bet.potential_win) * 100

    return {
      available: true,
      cashOutValue,
      originalStake: bet.amount,
      potentialWin: bet.potential_win,
      percentageOfPotentialWin: Math.round(percentageOfPotentialWin * 100) / 100
    }
  } catch (error) {
    console.error('Error calculating cash-out:', error)
    return {
      available: false,
      cashOutValue: 0,
      originalStake: 0,
      potentialWin: 0,
      percentageOfPotentialWin: 0,
      reason: 'Calculation error'
    }
  }
}

/**
 * Process cash-out
 */
export async function processCashOut(
  betId: string,
  userId: string,
  partial: boolean = false,
  partialPercentage: number = 100
): Promise<{
  success: boolean
  cashOutAmount: number
  remainingStake?: number
  error?: string
}> {
  try {
    // Validate partial percentage
    if (partial && (partialPercentage <= 0 || partialPercentage > 100)) {
      return {
        success: false,
        cashOutAmount: 0,
        error: 'Invalid partial percentage'
      }
    }

    // Get cash-out calculation
    const calculation = await calculateCashOut(betId)

    if (!calculation.available) {
      return {
        success: false,
        cashOutAmount: 0,
        error: calculation.reason || 'Cash-out not available'
      }
    }

    // Verify bet ownership
    const bet = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM user_bets WHERE id = ?',
      [betId]
    )

    if (!bet || bet.user_id !== userId) {
      return {
        success: false,
        cashOutAmount: 0,
        error: 'Unauthorized'
      }
    }

    // Calculate amounts
    const cashOutAmount = partial
      ? calculation.cashOutValue * (partialPercentage / 100)
      : calculation.cashOutValue

    const remainingStake = partial
      ? calculation.originalStake * (1 - partialPercentage / 100)
      : 0

    // Update bet status
    if (partial) {
      // Partial cash-out: update bet amount and record partial cash-out
      await query(
        `UPDATE user_bets 
         SET amount = ?, 
             potential_win = potential_win * ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [remainingStake, (1 - partialPercentage / 100), betId]
      )

      // Record partial cash-out in transactions
      await query(
        `INSERT INTO wallet_transactions 
          (id, user_id, type, amount, description, created_at)
         VALUES (?, ?, 'cashout_partial', ?, ?, CURRENT_TIMESTAMP)`,
        [
          `cashout_${betId}_${Date.now()}`,
          userId,
          cashOutAmount,
          `Partial cash-out (${partialPercentage}%) for bet ${betId}`
        ]
      )
    } else {
      // Full cash-out: mark bet as cashed out
      await query(
        `UPDATE user_bets 
         SET status = 'cashout', 
             payout_amount = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [cashOutAmount, betId]
      )

      // Record full cash-out
      await query(
        `INSERT INTO wallet_transactions 
          (id, user_id, type, amount, description, created_at)
         VALUES (?, ?, 'cashout', ?, ?, CURRENT_TIMESTAMP)`,
        [
          `cashout_${betId}_${Date.now()}`,
          userId,
          cashOutAmount,
          `Cash-out for bet ${betId}`
        ]
      )
    }

    // Credit wallet
    await query(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [cashOutAmount, userId]
    )

    return {
      success: true,
      cashOutAmount,
      remainingStake: partial ? remainingStake : undefined
    }
  } catch (error) {
    console.error('Error processing cash-out:', error)
    return {
      success: false,
      cashOutAmount: 0,
      error: 'Failed to process cash-out'
    }
  }
}

/**
 * Get cash-out history for a user
 */
export async function getCashOutHistory(userId: string, limit: number = 20) {
  try {
    const result = await query(
      `SELECT 
        wt.id,
        wt.type,
        wt.amount,
        wt.description,
        wt.created_at,
        ub.id as bet_id,
        ub.bet_type,
        ub.amount as original_stake
      FROM wallet_transactions wt
      LEFT JOIN user_bets ub ON wt.description LIKE '%' || ub.id || '%'
      WHERE wt.user_id = ? 
        AND wt.type IN ('cashout', 'cashout_partial')
      ORDER BY wt.created_at DESC
      LIMIT ?`,
      [userId, limit]
    )

    return result.rows
  } catch (error) {
    console.error('Error fetching cash-out history:', error)
    return []
  }
}

/**
 * Check if cash-out is enabled for a bet type
 */
export function isCashOutEnabled(betType: string): boolean {
  // Cash-out is available for most bet types
  const enabledTypes = ['single', 'accumulator', 'system']
  return enabledTypes.includes(betType)
}





