/**
 * Bitcoin Wallet Management
 * Generates real Bitcoin addresses using HD wallet (BIP32/BIP44)
 */

import crypto from 'crypto'
import * as bitcoin from 'bitcoinjs-lib'
import { BIP32Factory } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from './db'

const bip32 = BIP32Factory(ecc)

export type BitcoinNetwork = 'mainnet' | 'testnet'

interface WalletKey {
  id: string
  address: string
  derivationPath: string
  network: BitcoinNetwork
  created_at: Date
}

// Master seed — MUST be set via BITCOIN_MASTER_SEED env var in production.
// Issue #11: If missing in production, throw immediately to prevent data loss.
// In development, fall back to a random seed with a loud warning.
function getMasterSeed(): string {
  const envSeed = process.env.BITCOIN_MASTER_SEED
  if (envSeed) return envSeed

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Bitcoin Wallet] CRITICAL: BITCOIN_MASTER_SEED is not set in production. ' +
      'Refusing to start with a random seed — previously generated addresses would be unrecoverable. ' +
      'Generate a seed with: node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')" ' +
      'and set BITCOIN_MASTER_SEED in your .env file.'
    )
  }

  // Development: use random seed, but warn loudly
  const randomSeed = generateRandomSeed()
  console.warn(
    '\n⚠️  [Bitcoin Wallet] WARNING: BITCOIN_MASTER_SEED is not set.\n' +
    '   Using a random seed for this server session.\n' +
    '   This means different addresses on every restart.\n' +
    '   Set BITCOIN_MASTER_SEED in .env to fix this for development.\n'
  )
  return randomSeed
}

const MASTER_SEED = getMasterSeed()

function generateRandomSeed(): string {
  // Generate a random 32-byte seed (64 hex characters)
  // Use Node.js crypto module
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get or create master wallet key
 */
function getMasterKey(network: BitcoinNetwork = 'testnet'): any {
  const seed = Buffer.from(MASTER_SEED, 'hex')
  const networkObj = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
  
  return bip32.fromSeed(seed, networkObj)
}

/**
 * Generate a real Bitcoin address from HD wallet
 * Uses BIP44 derivation path: m/44'/coin_type'/account'/change/address_index
 * 
 * For Bitcoin testnet: coin_type = 1
 * For Bitcoin mainnet: coin_type = 0
 */
export function generateRealBitcoinAddress(
  addressIndex: number,
  network: BitcoinNetwork = 'testnet'
): {
  address: string
  derivationPath: string
  publicKey: string
} {
  const networkObj = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
  const coinType = network === 'mainnet' ? 0 : 1 // BIP44 coin type
  
  // BIP44 path: m/44'/coin_type'/0'/0/address_index
  // For deposits, we use change = 0 (external addresses)
  const derivationPath = `m/44'/${coinType}'/0'/0/${addressIndex}`
  
  const masterKey = getMasterKey(network)
  const derivedKey = masterKey.derivePath(derivationPath)
  
  // Generate P2WPKH (Bech32) address (native segwit)
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: derivedKey.publicKey,
    network: networkObj,
  })
  
  if (!address) {
    throw new Error('Failed to generate Bitcoin address')
  }
  
  return {
    address,
    derivationPath,
    publicKey: derivedKey.publicKey.toString('hex'),
  }
}

/**
 * Get next available address index (global counter across all users)
 * This ensures each address is unique regardless of user
 */
async function getNextAddressIndex(userId: string, network: BitcoinNetwork): Promise<number> {
  try {
    // Get all derivation paths for this network (global, not per-user)
    const result = await query<{ derivation_path: string }>(
      `SELECT derivation_path
       FROM bitcoin_addresses 
       WHERE network = ? AND derivation_path IS NOT NULL`,
      [network]
    )
    
    // Extract the index (last number) from each path and find max
    let maxIndex = -1
    for (const row of result.rows) {
      const path = row.derivation_path
      const lastSlashIndex = path.lastIndexOf('/')
      if (lastSlashIndex !== -1) {
        const indexStr = path.substring(lastSlashIndex + 1)
        const index = parseInt(indexStr, 10)
        if (!isNaN(index) && index > maxIndex) {
          maxIndex = index
        }
      }
    }
    
    return maxIndex + 1
  } catch (error) {
    // If derivation_path column doesn't exist yet, start from 0
    console.warn('Could not get next address index:', error)
    return 0
  }
}

/**
 * Generate a real Bitcoin address for a payment
 */
export async function generatePaymentAddress(
  userId: string,
  network: BitcoinNetwork = 'testnet'
): Promise<string> {
  // Get next address index (global counter across all users)
  const addressIndex = await getNextAddressIndex(userId, network)
  
  console.log(`[Bitcoin Wallet] Generating address at index ${addressIndex} for network ${network}`)
  
  // Generate real Bitcoin address
  const { address, derivationPath } = generateRealBitcoinAddress(addressIndex, network)
  
  console.log(`[Bitcoin Wallet] Generated address: ${address} (path: ${derivationPath})`)
  
  // Store the address info (optional, for tracking)
  // Note: This will be updated by createPaymentAddress in bitcoin-address.ts
  // We just return the address here
  
  return address
}

/**
 * Generate a real Bitcoin address with derivation path for a payment
 */
export async function generatePaymentAddressWithPath(
  userId: string,
  network: BitcoinNetwork = 'testnet'
): Promise<{ address: string; derivationPath: string }> {
  // Get next address index (global counter across all users)
  const addressIndex = await getNextAddressIndex(userId, network)
  
  console.log(`[Bitcoin Wallet] Generating address at index ${addressIndex} for network ${network}`)
  
  // Generate real Bitcoin address
  const { address, derivationPath } = generateRealBitcoinAddress(addressIndex, network)
  
  console.log(`[Bitcoin Wallet] Generated address: ${address} (path: ${derivationPath})`)
  
  return { address, derivationPath }
}

/**
 * Get private key for an address (for signing transactions)
 * WARNING: Only use this in secure, server-side code!
 */
export function getPrivateKeyForAddress(
  derivationPath: string,
  network: BitcoinNetwork = 'testnet'
): Buffer {
  const masterKey = getMasterKey(network)
  const derivedKey = masterKey.derivePath(derivationPath)
  return derivedKey.privateKey!
}

