import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { validateXSign, getCasinoConfig } from '@/lib/casino-api'
import { nanoid } from 'nanoid'

/**
 * POST /api/casino/callback
 * 
 * Callback endpoint for Slotegrator Game Aggregator
 * Receives POST requests during game sessions for:
 * - Balance requests
 * - Bet notifications
 * - Win notifications
 * - Refund notifications
 * - Rollback notifications
 * 
 * All requests must be validated using X-Sign authentication.
 * All transactions must be processed idempotently (only once per transaction_id).
 * 
 * Response timeout: 3 seconds (as per Slotegrator requirements)
 */

interface CallbackParams {
  action: string
  player_id: string
  currency: string
  session_id?: string
  game_uuid?: string
  transaction_id?: string
  amount?: string
  type?: string
  freespin_id?: string
  quantity?: string
  round_id?: string
  finished?: string
  bet_transaction_id?: string
  rollback_transactions?: string
  provider_round_id?: string
  transaction_datetime?: string
  casino_request_retry_count?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse form data (Slotegrator sends application/x-www-form-urlencoded)
    const formData = await request.formData()
    const params: CallbackParams = {
      action: formData.get('action') as string || '',
      player_id: formData.get('player_id') as string || '',
      currency: formData.get('currency') as string || '',
      session_id: formData.get('session_id') as string || undefined,
      game_uuid: formData.get('game_uuid') as string || undefined,
      transaction_id: formData.get('transaction_id') as string || undefined,
      amount: formData.get('amount') as string || undefined,
      type: formData.get('type') as string || undefined,
      freespin_id: formData.get('freespin_id') as string || undefined,
      quantity: formData.get('quantity') as string || undefined,
      round_id: formData.get('round_id') as string || undefined,
      finished: formData.get('finished') as string || undefined,
      bet_transaction_id: formData.get('bet_transaction_id') as string || undefined,
      rollback_transactions: formData.get('rollback_transactions') as string || undefined,
      provider_round_id: formData.get('provider_round_id') as string || undefined,
      transaction_datetime: formData.get('transaction_datetime') as string || undefined,
      casino_request_retry_count: formData.get('casino_request_retry_count') as string || undefined,
    }

    // Validate required fields
    if (!params.action || !params.player_id || !params.currency) {
      return NextResponse.json(
        {
          error_code: 'INTERNAL_ERROR',
          error_description: 'Missing required parameters: action, player_id, currency'
        },
        { status: 400 }
      )
    }

    // Get authorization headers
    const headers = {
      'X-Merchant-Id': request.headers.get('X-Merchant-Id') || '',
      'X-Timestamp': request.headers.get('X-Timestamp') || '',
      'X-Nonce': request.headers.get('X-Nonce') || '',
    }
    const receivedSign = request.headers.get('X-Sign') || ''

    // Validate X-Sign
    const config = getCasinoConfig()
    const isValid = validateXSign(
      params as Record<string, any>,
      headers,
      receivedSign,
      config.merchantKey
    )

    if (!isValid) {
      console.error('Invalid X-Sign in callback request', {
        action: params.action,
        player_id: params.player_id,
        transaction_id: params.transaction_id,
      })
      return NextResponse.json(
        {
          error_code: 'INTERNAL_ERROR',
          error_description: 'Invalid signature'
        },
        { status: 401 }
      )
    }

    // Route to appropriate handler based on action
    switch (params.action) {
      case 'balance':
        return await handleBalance(params)
      case 'bet':
        return await handleBet(params)
      case 'win':
        return await handleWin(params)
      case 'refund':
        return await handleRefund(params)
      case 'rollback':
        return await handleRollback(params)
      default:
        return NextResponse.json(
          {
            error_code: 'INTERNAL_ERROR',
            error_description: `Unknown action: ${params.action}`
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if we're approaching timeout (3 seconds)
    const elapsed = Date.now() - startTime
    if (elapsed > 2500) {
      console.warn(`Callback processing took ${elapsed}ms, approaching 3s timeout`)
    }

    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * Handle balance request
 * Returns current player balance
 */
async function handleBalance(params: CallbackParams) {
  const { player_id, currency, session_id } = params

  // Get user's wallet balance
  const wallet = await queryOne<{ balance: number }>(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
    [player_id, currency]
  )

  if (!wallet) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Wallet not found'
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    balance: wallet.balance
  })
}

/**
 * Handle bet notification
 * Deducts bet amount from player balance
 */
async function handleBet(params: CallbackParams) {
  const {
    player_id,
    currency,
    game_uuid,
    transaction_id,
    session_id,
    amount,
    type,
    freespin_id,
    quantity,
    round_id,
    finished,
  } = params

  if (!transaction_id || !amount || !game_uuid || !session_id) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Missing required parameters for bet'
      },
      { status: 400 }
    )
  }

  const betAmount = parseFloat(amount)

  // Check if transaction already processed (idempotency)
  const existingTx = await queryOne<{ id: string; balance_after: number }>(
    'SELECT id, balance_after FROM casino_transactions WHERE transaction_id = ?',
    [transaction_id]
  )

  if (existingTx) {
    // Transaction already processed, return existing result
    return NextResponse.json({
      balance: existingTx.balance_after,
      transaction_id: transaction_id
    })
  }

  // Get current balance
  const wallet = await queryOne<{ balance: number }>(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
    [player_id, currency]
  )

  if (!wallet) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Wallet not found'
      },
      { status: 404 }
    )
  }

  const balanceBefore = wallet.balance
  const balanceAfter = balanceBefore - betAmount

  // Check sufficient funds
  if (balanceAfter < 0) {
    return NextResponse.json(
      {
        error_code: 'INSUFFICIENT_FUNDS',
        error_description: 'Insufficient funds'
      },
      { status: 400 }
    )
  }

  // Update wallet balance
  await query(
    'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND currency = ?',
    [balanceAfter, player_id, currency]
  )

  // Create wallet transaction record
  const walletTxId = nanoid()
  await query(
    `INSERT INTO wallet_transactions 
      (id, user_id, transaction_type, amount, balance_before, balance_after, currency, status, description, reference_id, reference_type, created_at)
     VALUES (?, ?, 'casino_spin', ?, ?, ?, ?, 'completed', ?, ?, 'casino', CURRENT_TIMESTAMP)`,
    [
      walletTxId,
      player_id,
      -betAmount, // Negative for bet
      balanceBefore,
      balanceAfter,
      currency,
      `Casino bet: ${game_uuid}`,
      transaction_id,
    ]
  )

  // Store casino transaction for idempotency
  const casinoTxId = nanoid()
  await query(
    `INSERT INTO casino_transactions 
      (id, transaction_id, user_id, session_id, game_uuid, action, type, amount, currency, balance_before, balance_after, round_id, finished, freespin_id, quantity, status, created_at, processed_at)
     VALUES (?, ?, ?, ?, ?, 'bet', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      casinoTxId,
      transaction_id,
      player_id,
      session_id,
      game_uuid,
      type || 'bet',
      betAmount,
      currency,
      balanceBefore,
      balanceAfter,
      round_id || null,
      finished === 'true' ? 1 : 0,
      freespin_id || null,
      quantity ? parseInt(quantity) : null,
    ]
  )

  return NextResponse.json({
    balance: balanceAfter,
    transaction_id: transaction_id
  })
}

/**
 * Handle win notification
 * Credits win amount to player balance
 */
async function handleWin(params: CallbackParams) {
  const {
    player_id,
    currency,
    game_uuid,
    transaction_id,
    session_id,
    amount,
    type,
    freespin_id,
    quantity,
    round_id,
    finished,
  } = params

  if (!transaction_id || !amount || !game_uuid || !session_id) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Missing required parameters for win'
      },
      { status: 400 }
    )
  }

  const winAmount = parseFloat(amount)

  // Check if transaction already processed (idempotency)
  const existingTx = await queryOne<{ id: string; balance_after: number }>(
    'SELECT id, balance_after FROM casino_transactions WHERE transaction_id = ?',
    [transaction_id]
  )

  if (existingTx) {
    // Transaction already processed, return existing result
    return NextResponse.json({
      balance: existingTx.balance_after,
      transaction_id: transaction_id
    })
  }

  // Get current balance
  const wallet = await queryOne<{ balance: number }>(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
    [player_id, currency]
  )

  if (!wallet) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Wallet not found'
      },
      { status: 404 }
    )
  }

  const balanceBefore = wallet.balance
  const balanceAfter = balanceBefore + winAmount

  // Update wallet balance
  await query(
    'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND currency = ?',
    [balanceAfter, player_id, currency]
  )

  // Create wallet transaction record
  const walletTxId = nanoid()
  await query(
    `INSERT INTO wallet_transactions 
      (id, user_id, transaction_type, amount, balance_before, balance_after, currency, status, description, reference_id, reference_type, created_at)
     VALUES (?, ?, 'casino_win', ?, ?, ?, ?, 'completed', ?, ?, 'casino', CURRENT_TIMESTAMP)`,
    [
      walletTxId,
      player_id,
      winAmount, // Positive for win
      balanceBefore,
      balanceAfter,
      currency,
      `Casino win: ${game_uuid}${type ? ` (${type})` : ''}`,
      transaction_id,
    ]
  )

  // Store casino transaction for idempotency
  const casinoTxId = nanoid()
  await query(
    `INSERT INTO casino_transactions 
      (id, transaction_id, user_id, session_id, game_uuid, action, type, amount, currency, balance_before, balance_after, round_id, finished, freespin_id, quantity, status, created_at, processed_at)
     VALUES (?, ?, ?, ?, ?, 'win', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      casinoTxId,
      transaction_id,
      player_id,
      session_id,
      game_uuid,
      type || 'win',
      winAmount,
      currency,
      balanceBefore,
      balanceAfter,
      round_id || null,
      finished === 'true' ? 1 : 0,
      freespin_id || null,
      quantity ? parseInt(quantity) : null,
    ]
  )

  return NextResponse.json({
    balance: balanceAfter,
    transaction_id: transaction_id
  })
}

/**
 * Handle refund notification
 * Refunds bet amount to player balance
 */
async function handleRefund(params: CallbackParams) {
  const {
    player_id,
    currency,
    game_uuid,
    transaction_id,
    session_id,
    amount,
    type,
    bet_transaction_id,
    freespin_id,
    quantity,
    round_id,
    finished,
  } = params

  if (!transaction_id || !amount || !game_uuid || !session_id) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Missing required parameters for refund'
      },
      { status: 400 }
    )
  }

  const refundAmount = parseFloat(amount)

  // Check if transaction already processed (idempotency)
  const existingTx = await queryOne<{ id: string; balance_after: number }>(
    'SELECT id, balance_after FROM casino_transactions WHERE transaction_id = ?',
    [transaction_id]
  )

  if (existingTx) {
    // Transaction already processed, return existing result
    return NextResponse.json({
      balance: existingTx.balance_after,
      transaction_id: transaction_id
    })
  }

  // Get current balance
  const wallet = await queryOne<{ balance: number }>(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
    [player_id, currency]
  )

  if (!wallet) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Wallet not found'
      },
      { status: 404 }
    )
  }

  const balanceBefore = wallet.balance
  const balanceAfter = balanceBefore + refundAmount

  // Update wallet balance
  await query(
    'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND currency = ?',
    [balanceAfter, player_id, currency]
  )

  // Create wallet transaction record
  const walletTxId = nanoid()
  await query(
    `INSERT INTO wallet_transactions 
      (id, user_id, transaction_type, amount, balance_before, balance_after, currency, status, description, reference_id, reference_type, created_at)
     VALUES (?, ?, 'refund', ?, ?, ?, ?, 'completed', ?, ?, 'casino', CURRENT_TIMESTAMP)`,
    [
      walletTxId,
      player_id,
      refundAmount, // Positive for refund
      balanceBefore,
      balanceAfter,
      currency,
      `Casino refund: ${game_uuid}${bet_transaction_id ? ` (bet: ${bet_transaction_id})` : ''}`,
      transaction_id,
    ]
  )

  // Store casino transaction for idempotency
  const casinoTxId = nanoid()
  await query(
    `INSERT INTO casino_transactions 
      (id, transaction_id, user_id, session_id, game_uuid, action, type, amount, currency, balance_before, balance_after, round_id, finished, bet_transaction_id, freespin_id, quantity, status, created_at, processed_at)
     VALUES (?, ?, ?, ?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      casinoTxId,
      transaction_id,
      player_id,
      session_id,
      game_uuid,
      type || 'bet',
      refundAmount,
      currency,
      balanceBefore,
      balanceAfter,
      round_id || null,
      finished === 'true' ? 1 : 0,
      bet_transaction_id || null,
      freespin_id || null,
      quantity ? parseInt(quantity) : null,
    ]
  )

  return NextResponse.json({
    balance: balanceAfter,
    transaction_id: transaction_id
  })
}

/**
 * Handle rollback notification
 * Rolls back multiple transactions (bet, win, refund)
 */
async function handleRollback(params: CallbackParams) {
  const {
    player_id,
    currency,
    game_uuid,
    transaction_id,
    session_id,
    rollback_transactions,
    round_id,
    provider_round_id,
  } = params

  if (!transaction_id || !game_uuid || !session_id || !rollback_transactions) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Missing required parameters for rollback'
      },
      { status: 400 }
    )
  }

  // Check if transaction already processed (idempotency)
  const existingTx = await queryOne<{ id: string; balance_after: number }>(
    'SELECT id, balance_after FROM casino_transactions WHERE transaction_id = ?',
    [transaction_id]
  )

  if (existingTx) {
    // Transaction already processed, return existing result
    // Get rollback transaction IDs from metadata
    const rollbackTx = await queryOne<{ metadata: string }>(
      'SELECT metadata FROM casino_transactions WHERE transaction_id = ?',
      [transaction_id]
    )
    const rollbackIds = rollbackTx?.metadata ? JSON.parse(rollbackTx.metadata).rollback_transactions : []
    
    return NextResponse.json({
      balance: existingTx.balance_after,
      transaction_id: transaction_id,
      rollback_transactions: rollbackIds
    })
  }

  // Parse rollback transactions (JSON array)
  let rollbackTxs: Array<{
    action: string
    amount: number
    transaction_id: string
    type?: string
  }> = []

  try {
    rollbackTxs = JSON.parse(rollback_transactions)
  } catch (error) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Invalid rollback_transactions format'
      },
      { status: 400 }
    )
  }

  // Get current balance
  const wallet = await queryOne<{ balance: number }>(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?',
    [player_id, currency]
  )

  if (!wallet) {
    return NextResponse.json(
      {
        error_code: 'INTERNAL_ERROR',
        error_description: 'Wallet not found'
      },
      { status: 404 }
    )
  }

  let balanceBefore = wallet.balance
  let balanceAfter = balanceBefore
  const processedRollbackIds: string[] = []

  // Process each rollback transaction
  for (const rollbackTx of rollbackTxs) {
    const txAmount = parseFloat(String(rollbackTx.amount))
    
    // Find the original transaction
    const originalTx = await queryOne<{
      action: string
      amount: number
      balance_before: number
      balance_after: number
    }>(
      'SELECT action, amount, balance_before, balance_after FROM casino_transactions WHERE transaction_id = ?',
      [rollbackTx.transaction_id]
    )

    if (originalTx) {
      // Reverse the transaction
      if (originalTx.action === 'bet') {
        // Bet was deducted, add it back
        balanceAfter += txAmount
      } else if (originalTx.action === 'win') {
        // Win was added, subtract it
        balanceAfter -= txAmount
      } else if (originalTx.action === 'refund') {
        // Refund was added, subtract it
        balanceAfter -= txAmount
      }

      // Mark transaction as reversed
      await query(
        'UPDATE casino_transactions SET status = ? WHERE transaction_id = ?',
        ['reversed', rollbackTx.transaction_id]
      )

      processedRollbackIds.push(rollbackTx.transaction_id)
    } else {
      // Transaction doesn't exist, just record it as rollbacked
      processedRollbackIds.push(rollbackTx.transaction_id)
    }
  }

  // Update wallet balance
  await query(
    'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND currency = ?',
    [balanceAfter, player_id, currency]
  )

  // Create wallet transaction record for rollback
  const walletTxId = nanoid()
  const netAmount = balanceAfter - balanceBefore
  await query(
    `INSERT INTO wallet_transactions 
      (id, user_id, transaction_type, amount, balance_before, balance_after, currency, status, description, reference_id, reference_type, created_at)
     VALUES (?, ?, 'refund', ?, ?, ?, ?, 'completed', ?, ?, 'casino', CURRENT_TIMESTAMP)`,
    [
      walletTxId,
      player_id,
      netAmount,
      balanceBefore,
      balanceAfter,
      currency,
      `Casino rollback: ${game_uuid} (${rollbackTxs.length} transactions)`,
      transaction_id,
    ]
  )

  // Store casino transaction for idempotency
  const casinoTxId = nanoid()
  await query(
    `INSERT INTO casino_transactions 
      (id, transaction_id, user_id, session_id, game_uuid, action, amount, currency, balance_before, balance_after, round_id, status, metadata, created_at, processed_at)
     VALUES (?, ?, ?, ?, ?, 'rollback', ?, ?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      casinoTxId,
      transaction_id,
      player_id,
      session_id,
      game_uuid,
      netAmount,
      currency,
      balanceBefore,
      balanceAfter,
      round_id || null,
      JSON.stringify({
        rollback_transactions: processedRollbackIds,
        provider_round_id: provider_round_id || null,
      }),
    ]
  )

  return NextResponse.json({
    balance: balanceAfter,
    transaction_id: transaction_id,
    rollback_transactions: processedRollbackIds
  })
}

