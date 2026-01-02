import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

// Betting limits configuration
const BETTING_LIMITS = {
  MIN_BET: 1,        // Minimum bet amount in MAD
  MAX_BET: 100000,   // Maximum bet amount in MAD
  MAX_PAYOUT: 1000000, // Maximum potential payout in MAD
  USER_MAX_PENDING: 50  // Maximum pending bets per user
}

// Get session from cookie (simplified - in production use proper auth)
async function getUserId(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null
  
  try {
    const session = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP',
      [sessionCookie.value]
    )
    return session?.user_id || null
  } catch {
    return null
  }
}

// Validate bet amount against limits
function validateBetAmount(amount: number, potentialWin: number): { valid: boolean; error?: string } {
  if (amount < BETTING_LIMITS.MIN_BET) {
    return { valid: false, error: `Minimum bet is ${BETTING_LIMITS.MIN_BET} MAD` }
  }
  if (amount > BETTING_LIMITS.MAX_BET) {
    return { valid: false, error: `Maximum bet is ${BETTING_LIMITS.MAX_BET} MAD` }
  }
  if (potentialWin > BETTING_LIMITS.MAX_PAYOUT) {
    return { valid: false, error: `Maximum payout is ${BETTING_LIMITS.MAX_PAYOUT} MAD` }
  }
  return { valid: true }
}

// Check user's pending bets limit
async function checkUserPendingBets(userId: string): Promise<{ canBet: boolean; error?: string }> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_bets WHERE user_id = ? AND status = ?',
    [userId, 'pending']
  )
  
  const pendingCount = result?.count || 0
  if (pendingCount >= BETTING_LIMITS.USER_MAX_PENDING) {
    return { canBet: false, error: `You have reached the maximum of ${BETTING_LIMITS.USER_MAX_PENDING} pending bets` }
  }
  
  return { canBet: true }
}

// Check and deduct wallet balance (atomic operation to prevent race conditions)
async function deductWalletBalance(userId: string, amount: number): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  try {
    // Use atomic UPDATE with WHERE clause to prevent race conditions
    // This ensures balance check and deduction happen atomically
    // SQLite will only update if balance >= amount
    const result = await query(
      `UPDATE wallets 
       SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND currency = ? AND balance >= ?`,
      [amount, userId, 'MAD', amount]
    )
    
    // Check if any rows were updated (rowCount > 0 means update succeeded)
    if (result.rowCount === 0) {
      // Check if wallet exists or if balance is insufficient
      const wallet = await queryOne<{ balance: number }>(
        'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
        [userId, 'MAD']
      )
      
      if (!wallet) {
        return { success: false, error: 'Wallet not found' }
      }
      
      if (wallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' }
      }
      
      return { success: false, error: 'Failed to process payment' }
    }
    
    // Get updated balance
    const updatedWallet = await queryOne<{ balance: number }>(
      'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
      [userId, 'MAD']
    )
    
    return { success: true, newBalance: updatedWallet?.balance || 0 }
  } catch (error) {
    console.error('Error deducting wallet balance:', error)
    return { success: false, error: 'Failed to process payment' }
  }
}

// Validate odds haven't changed significantly
async function validateOdds(matchId: string, marketId: string, selection: string, expectedOdds: number): Promise<{ valid: boolean; currentOdds?: number; error?: string }> {
  try {
    const currentOdd = await queryOne<{ odds_value: number }>(
      'SELECT odds_value FROM odds WHERE match_id = ? AND market_id = ? AND selection = ? AND is_active = 1',
      [matchId, marketId, selection]
    )
    
    if (!currentOdd) {
      return { valid: false, error: 'Market not available' }
    }
    
    // Allow 5% odds variation
    const oddsChange = Math.abs(currentOdd.odds_value - expectedOdds) / expectedOdds
    if (oddsChange > 0.05) {
      return { valid: false, currentOdds: currentOdd.odds_value, error: 'Odds have changed' }
    }
    
    return { valid: true, currentOdds: currentOdd.odds_value }
  } catch (error) {
    return { valid: true, currentOdds: expectedOdds } // Fallback to expected odds if validation fails
  }
}

// Calculate accumulator odds
function calculateAccumulatorOdds(bets: Array<{ odds: number }>): number {
  return bets.reduce((total, bet) => total * bet.odds, 1)
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      matchId,
      gameId,
      betType, // 'single', 'accumulator', 'system'
      marketType,
      marketId,
      selection,
      odds,
      amount,
      currency = 'MAD',
      selections // For accumulator bets: Array<{ matchId, marketId, selection, odds }>
    } = body

    // Validate required fields
    if (!betType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Single bet validation
    if (betType === 'single' && (!selection || !odds)) {
      return NextResponse.json(
        { error: 'Single bet requires selection and odds' },
        { status: 400 }
      )
    }

    // Accumulator bet validation
    if (betType === 'accumulator' && (!selections || selections.length < 2)) {
      return NextResponse.json(
        { error: 'Accumulator bet requires at least 2 selections' },
        { status: 400 }
      )
    }

    // Check user's pending bets limit
    const pendingCheck = await checkUserPendingBets(userId)
    if (!pendingCheck.canBet) {
      return NextResponse.json(
        { error: pendingCheck.error },
        { status: 400 }
      )
    }

    let finalOdds = odds
    let potentialWin = amount * odds

    // Handle accumulator bets
    if (betType === 'accumulator') {
      finalOdds = calculateAccumulatorOdds(selections)
      potentialWin = amount * finalOdds

      // Validate each selection's odds
      for (const sel of selections) {
        if (sel.matchId && sel.marketId) {
          const oddsValidation = await validateOdds(sel.matchId, sel.marketId, sel.selection, sel.odds)
          if (!oddsValidation.valid) {
            return NextResponse.json(
              { 
                error: oddsValidation.error,
                currentOdds: oddsValidation.currentOdds,
                selection: sel.selection
              },
              { status: 400 }
            )
          }
        }
      }
    } else if (betType === 'single' && matchId && marketId) {
      // Validate odds for single bets
      const oddsValidation = await validateOdds(matchId, marketId, selection, odds)
      if (!oddsValidation.valid) {
        return NextResponse.json(
          { 
            error: oddsValidation.error,
            currentOdds: oddsValidation.currentOdds
          },
          { status: 400 }
        )
      }
      finalOdds = oddsValidation.currentOdds || odds
      potentialWin = amount * finalOdds
    }

    // Validate bet amount
    const amountValidation = validateBetAmount(amount, potentialWin)
    if (!amountValidation.valid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      )
    }

    // Deduct wallet balance
    const balanceDeduction = await deductWalletBalance(userId, amount)
    if (!balanceDeduction.success) {
      return NextResponse.json(
        { error: balanceDeduction.error },
        { status: 400 }
      )
    }

    // Create bet record
    const betId = nanoid()
    
    try {
      if (betType === 'accumulator') {
        // Store accumulator bet with selections as JSON
        await query(
          `INSERT INTO user_bets (
            id, user_id, game_id, match_id, bet_type, market_type, 
            selection, odds, amount, potential_win, status, currency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [
            betId,
            userId,
            gameId || null,
            null, // match_id is null for accumulator
            betType,
            'accumulator',
            JSON.stringify(selections), // Store selections as JSON
            finalOdds,
            amount,
            potentialWin,
            currency
          ]
        )
      } else {
        // Store single bet
        await query(
          `INSERT INTO user_bets (
            id, user_id, game_id, match_id, bet_type, market_type, 
            selection, odds, amount, potential_win, status, currency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [
            betId,
            userId,
            gameId || null,
            matchId || null,
            betType,
            marketType || null,
            selection,
            finalOdds,
            amount,
            potentialWin,
            currency
          ]
        )
      }

      return NextResponse.json({
        betId,
        message: 'Bet placed successfully',
        status: 'pending',
        odds: finalOdds,
        potentialWin,
        newBalance: balanceDeduction.newBalance
      })
    } catch (dbError) {
      // Rollback: Refund balance if bet creation fails
      await query(
        'UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND currency = ?',
        [amount, userId, currency]
      )
      throw dbError
    }
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let sql = `
      SELECT 
        b.id,
        b.user_id,
        b.game_id,
        b.match_id,
        b.bet_type,
        b.market_type,
        b.selection,
        b.odds,
        b.amount,
        b.potential_win,
        b.status,
        b.result,
        b.payout,
        b.currency,
        b.placed_at,
        b.settled_at,
        m.home_team,
        m.away_team,
        m.current_score as match_score
      FROM user_bets b
      LEFT JOIN matches m ON b.match_id = m.id
      WHERE b.user_id = ?
    `

    const params: unknown[] = [userId]

    if (status) {
      sql += ' AND b.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY b.placed_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const result = await query(sql, params)

    return NextResponse.json({
      bets: result.rows,
      total: result.rowCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    )
  }
}
