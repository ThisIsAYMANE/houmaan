/**
 * USDT Payment Detection & Monitoring
 * Polls the block explorer for incoming USDT transfers and credits
 * the user wallet once the required confirmations are reached.
 *
 * Mirrors the pattern in lib/payment-detection.ts.
 */

import { query, queryOne } from './db'
import { v4 as uuidv4 } from 'uuid'
import { checkUSDTAddressForPayments, USDTTransfer } from './usdt-api'
import { markUSDTAddressAsUsed } from './usdt-address'
import { createTransaction } from './wallet'
import { USDTNetwork } from './usdt-wallet'

// Confirmations required before crediting the wallet
const REQUIRED_CONFIRMATIONS: Record<USDTNetwork, number> = {
  ethereum: 12,  // ~3 minutes
  bsc: 15,       // ~45 seconds
  polygon: 20,   // ~40 seconds
}

interface USDTMonitoring {
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
  usdt_amount: number | null
  address: string | null
  tx_hash: string | null
  status: string
  network: string | null
  expires_at: Date | null
  created_at: Date
}

/**
 * Start a USDT payment monitoring job for a deposit
 */
export async function startUSDTPaymentMonitoring(
  depositId: string,
  address: string,
  network: USDTNetwork
): Promise<USDTMonitoring> {
  const existing = await queryOne<USDTMonitoring>(
    `SELECT * FROM usdt_payment_monitoring WHERE deposit_id = ?`,
    [depositId]
  )

  if (existing) return existing

  const id = uuidv4()
  await query(
    `INSERT INTO usdt_payment_monitoring
       (id, deposit_id, address, network, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [id, depositId, address, network]
  )

  const result = await queryOne<USDTMonitoring>(
    `SELECT * FROM usdt_payment_monitoring WHERE id = ?`,
    [id]
  )

  if (!result) throw new Error('Failed to create USDT payment monitoring')

  return result
}

/**
 * Check payment status for a USDT deposit.
 * Polls the block explorer and updates the deposit record.
 */
export async function checkUSDTPaymentStatus(depositId: string): Promise<{
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

  const network = (deposit.network || 'bsc') as USDTNetwork
  const monitoring = await queryOne<USDTMonitoring>(
    `SELECT * FROM usdt_payment_monitoring WHERE deposit_id = ?`,
    [depositId]
  )

  const fromBlock = monitoring?.last_block_checked ?? 0
  const required = REQUIRED_CONFIRMATIONS[network] ?? 15

  // Fetch transfers from block explorer
  const status = await checkUSDTAddressForPayments(deposit.address, network, fromBlock)

  if (!status.hasTransfers || status.transfers.length === 0) {
    // Update last-checked timestamp
    await query(
      `UPDATE usdt_payment_monitoring
       SET last_checked_at = CURRENT_TIMESTAMP,
           check_count = check_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE deposit_id = ?`,
      [depositId]
    )
    return { hasPayment: false, confirmed: false, confirmations: 0, txHash: null, amount: 0 }
  }

  // Use the most recent inbound transfer
  const latest: USDTTransfer = status.transfers[status.transfers.length - 1]
  const txHash = latest.txHash
  const amount = status.totalReceived
  const confirmations = latest.confirmations
  const confirmed = confirmations >= required

  // Update deposit record
  await query(
    `UPDATE deposits
     SET tx_hash = ?,
         usdt_amount = ?,
         confirmations = ?,
         status = CASE WHEN ? >= ? THEN 'completed' ELSE 'processing' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [txHash, amount, confirmations, confirmations, required, depositId]
  )

  // If confirmed and not already credited — credit the user wallet
  if (confirmed && deposit.status !== 'completed') {
    await markUSDTAddressAsUsed(deposit.address, depositId)

    // Credit the wallet in the user's local currency (fiat equivalent stored in deposit.amount)
    await createTransaction({
      userId: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount,
      currency: deposit.currency,
      description: `USDT deposit (${network.toUpperCase()}) – ${txHash.substring(0, 10)}...`,
      referenceId: depositId,
      referenceType: 'deposit',
      metadata: {
        usdt_amount: amount,
        tx_hash: txHash,
        confirmations,
        address: deposit.address,
        network,
        token: 'USDT',
      },
    })

    // Mark monitoring as completed
    await query(
      `UPDATE usdt_payment_monitoring
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE deposit_id = ?`,
      [depositId]
    )
  }

  // Always update last-checked meta
  await query(
    `UPDATE usdt_payment_monitoring
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
 * Process all active USDT monitoring jobs (called by a background cron/worker)
 */
export async function processUSDTPaymentMonitoring(): Promise<{
  checked: number
  completed: number
  failed: number
}> {
  const activeJobs = await query<USDTMonitoring>(
    `SELECT * FROM usdt_payment_monitoring
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
      const result = await checkUSDTPaymentStatus(job.deposit_id)
      if (result.confirmed) completed++
    } catch (err) {
      console.error(`[USDT Monitor] Error for deposit ${job.deposit_id}:`, err)
      failed++

      // Mark as failed after too many errors
      if (job.check_count >= 20) {
        await query(
          `UPDATE usdt_payment_monitoring
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
 * Expire stale USDT deposits that were never paid
 */
export async function cleanupExpiredUSDTPayments(): Promise<number> {
  const result = await query(
    `UPDATE deposits
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status IN ('pending', 'processing')
       AND token_type = 'usdt'
       AND expires_at < CURRENT_TIMESTAMP`
  )

  await query(
    `UPDATE usdt_payment_monitoring
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active'
       AND deposit_id IN (
         SELECT id FROM deposits WHERE status = 'expired' AND token_type = 'usdt'
       )`
  )

  return result.rowCount
}
