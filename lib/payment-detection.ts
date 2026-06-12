/**
 * Payment Detection System
 * Monitors Bitcoin addresses for incoming payments
 */

import { query, queryOne } from './db'
import { bitcoinAPI } from './bitcoin-api'
import { markAddressAsUsed } from './bitcoin-address'
import { v4 as uuidv4 } from 'uuid'
import { createTransaction } from './wallet'

interface PaymentMonitoring {
  id: string
  deposit_id: string
  address: string
  last_checked_at: Date
  check_count: number
  status: 'active' | 'completed' | 'failed' | 'expired'
  created_at: Date
  updated_at: Date
}

interface Deposit {
  id: string
  user_id: string
  amount: number
  currency: string
  btc_amount: number | null
  address: string | null
  tx_hash: string | null
  status: string
  confirmations: number | null
  required_confirmations: number | null
  expires_at: Date | null
  created_at: Date
}

/**
 * Start monitoring a payment address
 */
export async function startPaymentMonitoring(
  depositId: string,
  address: string
): Promise<PaymentMonitoring> {
  // Check if monitoring already exists
  const existing = await queryOne<PaymentMonitoring>(
    `SELECT * FROM payment_monitoring WHERE deposit_id = ?`,
    [depositId]
  )

  if (existing) {
    return existing
  }

  // Create new monitoring record
  const id = uuidv4()
  await query(
    `INSERT INTO payment_monitoring (id, deposit_id, address, status)
     VALUES (?, ?, ?, 'active')`,
    [id, depositId, address]
  )

  const result = await queryOne<PaymentMonitoring>(
    `SELECT * FROM payment_monitoring WHERE id = ?`,
    [id]
  )

  if (!result) {
    throw new Error('Failed to create payment monitoring')
  }

  return result
}

/**
 * Check payment status for a deposit
 */
export async function checkPaymentStatus(
  depositId: string
): Promise<{
  hasPayment: boolean
  confirmed: boolean
  confirmations: number
  txHash: string | null
  amount: number // in BTC
}> {
  const deposit = await queryOne<Deposit>(
    `SELECT * FROM deposits WHERE id = ?`,
    [depositId]
  )

  if (!deposit || !deposit.address) {
    return {
      hasPayment: false,
      confirmed: false,
      confirmations: 0,
      txHash: null,
      amount: 0,
    }
  }

  // Check address for payments
  const paymentInfo = await bitcoinAPI.checkAddressForPayments(deposit.address)

  if (!paymentInfo.hasPayments || paymentInfo.transactions.length === 0) {
    return {
      hasPayment: false,
      confirmed: false,
      confirmations: 0,
      txHash: null,
      amount: 0,
    }
  }

  // Get the most recent transaction
  const latestTx = paymentInfo.transactions[0]
  const txHash = latestTx.txid
  const amount = bitcoinAPI.satoshisToBTC(paymentInfo.totalReceived)

  // Get confirmation count
  const confirmations = await bitcoinAPI.getTransactionConfirmations(txHash)
  const requiredConfirmations = deposit.required_confirmations || 1
  const confirmed = confirmations >= requiredConfirmations

  // Update deposit with payment info
  await query(
    `UPDATE deposits 
     SET tx_hash = ?, 
         btc_amount = ?,
         confirmations = ?,
         status = CASE 
           WHEN ? >= ? THEN 'completed'
           ELSE 'processing'
         END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      txHash,
      amount,
      confirmations,
      confirmations,
      requiredConfirmations,
      depositId,
    ]
  )

  // If confirmed, mark address as used and create wallet transaction
  if (confirmed && deposit.status !== 'completed') {
    await markAddressAsUsed(deposit.address, depositId)

    // Create wallet transaction for deposit
    await createTransaction({
      userId: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount, // Amount in user's currency (EUR)
      currency: deposit.currency,
      description: `Bitcoin deposit - ${txHash.substring(0, 8)}...`,
      referenceId: depositId,
      referenceType: 'deposit',
      metadata: {
        btc_amount: amount,
        tx_hash: txHash,
        confirmations,
        address: deposit.address,
      },
    })

    // Update monitoring status
    await query(
      `UPDATE payment_monitoring 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE deposit_id = ?`,
      [depositId]
    )
  }

  // Update monitoring last checked time
  await query(
    `UPDATE payment_monitoring 
     SET last_checked_at = CURRENT_TIMESTAMP,
         check_count = check_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE deposit_id = ?`,
    [depositId]
  )

  return {
    hasPayment: true,
    confirmed,
    confirmations,
    txHash,
    amount,
  }
}

/**
 * Process all active payment monitoring jobs
 */
export async function processPaymentMonitoring(): Promise<{
  checked: number
  completed: number
  failed: number
}> {
  const activeJobs = await query<PaymentMonitoring>(
    `SELECT * FROM payment_monitoring 
     WHERE status = 'active'
     ORDER BY last_checked_at ASC
     LIMIT 50`
  )

  let checked = 0
  let completed = 0
  let failed = 0

  for (const job of activeJobs.rows) {
    try {
      checked++
      const status = await checkPaymentStatus(job.deposit_id)

      if (status.confirmed) {
        completed++
      }
    } catch (error) {
      console.error(`Error checking payment for deposit ${job.deposit_id}:`, error)
      failed++

      // Mark as failed after multiple failures
      const jobWithCount = await queryOne<PaymentMonitoring>(
        `SELECT * FROM payment_monitoring WHERE id = ?`,
        [job.id]
      )

      if (jobWithCount && jobWithCount.check_count >= 10) {
        await query(
          `UPDATE payment_monitoring 
           SET status = 'failed', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [job.id]
        )
      }
    }
  }

  return { checked, completed, failed }
}

/**
 * Clean up expired payments
 */
export async function cleanupExpiredPayments(): Promise<number> {
  // Mark expired deposits as expired
  const result = await query(
    `UPDATE deposits 
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status IN ('pending', 'processing')
     AND expires_at < CURRENT_TIMESTAMP`
  )

  // Update monitoring status
  await query(
    `UPDATE payment_monitoring 
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active'
     AND deposit_id IN (
       SELECT id FROM deposits 
       WHERE status = 'expired'
     )`
  )

  return result.rowCount
}








