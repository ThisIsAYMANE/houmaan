/**
 * ETH Payment Detection & Monitoring
 * Polls the block explorer for incoming native ETH transfers and credits
 * the user wallet once the required confirmations are reached.
 */

import { query, queryOne } from './db'
import { v4 as uuidv4 } from 'uuid'
import { checkETHAddressForPayments, ETHTransfer } from './eth-api'
import { markETHAddressAsUsed } from './eth-address'
import { createTransaction } from './wallet'

// Confirmations required before crediting the wallet
const REQUIRED_CONFIRMATIONS = 12 // ~3 minutes on Ethereum

interface ETHMonitoring {
  id: string
  deposit_id: string
  address: string
  network: string
  last_checked_at: Date
  last_block_checked: number
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
  eth_amount: number | null
  address: string | null
  tx_hash: string | null
  status: string
  expires_at: Date | null
  created_at: Date
}

/**
 * Start an ETH payment monitoring job for a deposit
 */
export async function startETHPaymentMonitoring(
  depositId: string,
  address: string
): Promise<ETHMonitoring> {
  const existing = await queryOne<ETHMonitoring>(
    `SELECT * FROM eth_payment_monitoring WHERE deposit_id = ?`,
    [depositId]
  )

  if (existing) return existing

  const id = uuidv4()
  await query(
    `INSERT INTO eth_payment_monitoring
       (id, deposit_id, address, network, status)
     VALUES (?, ?, ?, 'ethereum', 'active')`,
    [id, depositId, address]
  )

  const result = await queryOne<ETHMonitoring>(
    `SELECT * FROM eth_payment_monitoring WHERE id = ?`,
    [id]
  )

  if (!result) throw new Error('Failed to create ETH payment monitoring')

  return result
}

/**
 * Check payment status for an ETH deposit.
 * Polls the block explorer and updates the deposit record.
 */
export async function checkETHPaymentStatus(depositId: string): Promise<{
  hasPayment: boolean
  confirmed: boolean
  confirmations: number
  txHash: string | null
  amount: number
}> {
  const deposit = await queryOne<Deposit>(
    `SELECT * FROM deposits WHERE id = ?`,
    [depositId]
  )

  if (!deposit || !deposit.address) {
    return { hasPayment: false, confirmed: false, confirmations: 0, txHash: null, amount: 0 }
  }

  const monitoring = await queryOne<ETHMonitoring>(
    `SELECT * FROM eth_payment_monitoring WHERE deposit_id = ?`,
    [depositId]
  )

  const fromBlock = monitoring?.last_block_checked ?? 0

  // Fetch native ETH transfers from block explorer
  const status = await checkETHAddressForPayments(deposit.address, fromBlock)

  if (!status.hasTransfers || status.transfers.length === 0) {
    // Update last-checked timestamp
    await query(
      `UPDATE eth_payment_monitoring
       SET last_checked_at = CURRENT_TIMESTAMP,
           check_count = check_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE deposit_id = ?`,
      [depositId]
    )
    return { hasPayment: false, confirmed: false, confirmations: 0, txHash: null, amount: 0 }
  }

  // Use the most recent inbound transfer
  const latest: ETHTransfer = status.transfers[status.transfers.length - 1]
  const txHash = latest.txHash
  const amount = status.totalReceived
  const confirmations = latest.confirmations
  const confirmed = confirmations >= REQUIRED_CONFIRMATIONS

  // Update deposit record
  await query(
    `UPDATE deposits
     SET tx_hash = ?,
         eth_amount = ?,
         confirmations = ?,
         status = CASE WHEN ? >= ? THEN 'completed' ELSE 'processing' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [txHash, amount, confirmations, confirmations, REQUIRED_CONFIRMATIONS, depositId]
  )

  // If confirmed and not already credited — credit the user wallet
  if (confirmed && deposit.status !== 'completed') {
    await markETHAddressAsUsed(deposit.address, depositId)

    // Credit the wallet in the user's local currency
    await createTransaction({
      userId: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount,
      currency: deposit.currency,
      description: `ETH deposit – ${txHash.substring(0, 10)}...`,
      referenceId: depositId,
      referenceType: 'deposit',
      metadata: {
        eth_amount: amount,
        tx_hash: txHash,
        confirmations,
        address: deposit.address,
        network: 'ethereum',
        token: 'ETH',
      },
    })

    // Mark monitoring as completed
    await query(
      `UPDATE eth_payment_monitoring
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE deposit_id = ?`,
      [depositId]
    )
  }

  // Always update last-checked meta
  await query(
    `UPDATE eth_payment_monitoring
     SET last_checked_at = CURRENT_TIMESTAMP,
         last_block_checked = ?,
         check_count = check_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE deposit_id = ?`,
    [latest.blockNumber, depositId]
  )

  return { hasPayment: true, confirmed, confirmations, txHash, amount }
}

/**
 * Process all active ETH monitoring jobs (called by a background cron/worker)
 */
export async function processETHPaymentMonitoring(): Promise<{
  checked: number
  completed: number
  failed: number
}> {
  const activeJobs = await query<ETHMonitoring>(
    `SELECT * FROM eth_payment_monitoring
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
      const result = await checkETHPaymentStatus(job.deposit_id)
      if (result.confirmed) completed++
    } catch (err) {
      console.error(`[ETH Monitor] Error for deposit ${job.deposit_id}:`, err)
      failed++

      // Mark as failed after too many errors
      if (job.check_count >= 20) {
        await query(
          `UPDATE eth_payment_monitoring
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
 * Expire stale ETH deposits that were never paid
 */
export async function cleanupExpiredETHPayments(): Promise<number> {
  const result = await query(
    `UPDATE deposits
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status IN ('pending', 'processing')
       AND token_type = 'eth'
       AND expires_at < CURRENT_TIMESTAMP`
  )

  await query(
    `UPDATE eth_payment_monitoring
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active'
       AND deposit_id IN (
         SELECT id FROM deposits WHERE status = 'expired' AND token_type = 'eth'
       )`
  )

  return result.rowCount
}
