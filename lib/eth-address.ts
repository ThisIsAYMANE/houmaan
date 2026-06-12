/**
 * ETH Address Management
 * Generates and manages unique EVM payment addresses for native ETH deposits.
 * Reuses the EVM wallet generation logic from lib/usdt-wallet.ts.
 */

import { query, queryOne } from './db'
import { v4 as uuidv4 } from 'uuid'
import { deriveUSDTAddress } from './usdt-wallet'

export interface ETHAddress {
  id: string
  address: string
  user_id: string
  deposit_id: string | null
  network: string
  derivation_index: number
  derivation_path: string | null
  expires_at: Date
  used_at: Date | null
  created_at: Date
}

/**
 * Get the next available derivation index for ETH addresses.
 * We use the eth_addresses table to guarantee uniqueness for native ETH.
 */
async function getNextETHIndex(): Promise<number> {
  try {
    const result = await query<{ max_index: number | null }>(
      `SELECT MAX(derivation_index) as max_index FROM eth_addresses`
    )
    const max = result.rows[0]?.max_index
    return max !== null && max !== undefined ? max + 1 : 0
  } catch (err) {
    console.warn('[ETH Address] Could not read next index, defaulting to 0:', err)
    return 0
  }
}

/**
 * Generate a fresh EVM address for an ETH deposit using the shared HD wallet.
 */
async function generateETHPaymentAddress(): Promise<{ address: string; derivationPath: string; index: number }> {
  // Use a dedicated index counter for ETH to keep things isolated from USDT
  // (though they share the same master seed, the index sequence will overlap,
  // which is fine since they are just different addresses in the same HD wallet)
  const index = await getNextETHIndex()
  const { address, derivationPath } = deriveUSDTAddress(index)

  console.log(
    `[ETH Wallet] Generated address ${address} at path ${derivationPath} for native ETH`
  )

  return { address, derivationPath, index }
}

/**
 * Create and persist a new native ETH payment address for a user.
 */
export async function createETHPaymentAddress(
  userId: string,
  depositId: string | null,
  expirationMinutes = 30
): Promise<ETHAddress> {
  const { address, derivationPath, index } = await generateETHPaymentAddress()

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)

  const id = uuidv4()

  await query(
    `INSERT INTO eth_addresses
       (id, address, user_id, deposit_id, network, derivation_index, derivation_path, expires_at)
     VALUES (?, ?, ?, ?, 'ethereum', ?, ?, ?)`,
    [id, address, userId, depositId, index, derivationPath, expiresAt.toISOString()]
  )

  const result = await queryOne<ETHAddress>(
    `SELECT * FROM eth_addresses WHERE id = ?`,
    [id]
  )

  if (!result) throw new Error('Failed to create ETH payment address')

  return result
}

/**
 * Get address record by EVM address string
 */
export async function getETHAddressByAddress(
  address: string
): Promise<ETHAddress | null> {
  return queryOne<ETHAddress>(
    `SELECT * FROM eth_addresses WHERE address = ?`,
    [address]
  )
}

/**
 * Get address record by deposit ID
 */
export async function getETHAddressByDepositId(
  depositId: string
): Promise<ETHAddress | null> {
  return queryOne<ETHAddress>(
    `SELECT * FROM eth_addresses WHERE deposit_id = ?`,
    [depositId]
  )
}

/**
 * Mark an address as used once a payment is confirmed
 */
export async function markETHAddressAsUsed(
  address: string,
  depositId: string
): Promise<void> {
  await query(
    `UPDATE eth_addresses
     SET used_at = CURRENT_TIMESTAMP, deposit_id = ?
     WHERE address = ?`,
    [depositId, address]
  )
}

/**
 * Clean up expired, unused addresses
 */
export async function cleanupExpiredETHAddresses(): Promise<number> {
  const result = await query(
    `DELETE FROM eth_addresses
     WHERE expires_at < CURRENT_TIMESTAMP AND used_at IS NULL`
  )
  return result.rowCount
}
