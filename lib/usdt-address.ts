/**
 * USDT Address Management
 * Generates and manages unique EVM payment addresses for USDT deposits.
 * Mirrors the pattern in lib/bitcoin-address.ts.
 */

import { query, queryOne } from './db'
import { v4 as uuidv4 } from 'uuid'
import {
  generateUSDTPaymentAddress,
  USDTNetwork,
} from './usdt-wallet'

export type { USDTNetwork }

export interface USDTAddress {
  id: string
  address: string
  user_id: string
  deposit_id: string | null
  network: USDTNetwork
  derivation_index: number
  derivation_path: string | null
  expires_at: Date
  used_at: Date | null
  created_at: Date
}

/**
 * Create and persist a new USDT payment address for a user.
 */
export async function createUSDTPaymentAddress(
  userId: string,
  depositId: string | null,
  network: USDTNetwork = 'bsc',
  expirationMinutes = 30
): Promise<USDTAddress> {
  const { address, derivationPath, index } = await generateUSDTPaymentAddress(userId, network)

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)

  const id = uuidv4()

  await query(
    `INSERT INTO usdt_addresses
       (id, address, user_id, deposit_id, network, derivation_index, derivation_path, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, address, userId, depositId, network, index, derivationPath, expiresAt.toISOString()]
  )

  const result = await queryOne<USDTAddress>(
    `SELECT * FROM usdt_addresses WHERE id = ?`,
    [id]
  )

  if (!result) throw new Error('Failed to create USDT payment address')

  return result
}

/**
 * Get address record by EVM address string
 */
export async function getUSDTAddressByAddress(
  address: string
): Promise<USDTAddress | null> {
  return queryOne<USDTAddress>(
    `SELECT * FROM usdt_addresses WHERE address = ?`,
    [address]
  )
}

/**
 * Get address record by deposit ID
 */
export async function getUSDTAddressByDepositId(
  depositId: string
): Promise<USDTAddress | null> {
  return queryOne<USDTAddress>(
    `SELECT * FROM usdt_addresses WHERE deposit_id = ?`,
    [depositId]
  )
}

/**
 * Mark an address as used once a payment is confirmed
 */
export async function markUSDTAddressAsUsed(
  address: string,
  depositId: string
): Promise<void> {
  await query(
    `UPDATE usdt_addresses
     SET used_at = CURRENT_TIMESTAMP, deposit_id = ?
     WHERE address = ?`,
    [depositId, address]
  )
}

/**
 * Get all active (unexpired, unused) addresses for a user
 */
export async function getUserActiveUSDTAddresses(
  userId: string
): Promise<USDTAddress[]> {
  const result = await query<USDTAddress>(
    `SELECT * FROM usdt_addresses
     WHERE user_id = ?
       AND expires_at > CURRENT_TIMESTAMP
       AND used_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * Clean up expired, unused addresses
 */
export async function cleanupExpiredUSDTAddresses(): Promise<number> {
  const result = await query(
    `DELETE FROM usdt_addresses
     WHERE expires_at < CURRENT_TIMESTAMP AND used_at IS NULL`
  )
  return result.rowCount
}
