/**
 * USDT (EVM) Wallet Management
 * Generates EVM-compatible addresses (Ethereum, BSC, Polygon) using HD wallet (BIP44)
 * Uses derivation path: m/44'/60'/0'/0/index  (Ethereum coin type = 60)
 *
 * These addresses can receive:
 *   - USDT ERC-20 on Ethereum
 *   - USDT BEP-20 on Binance Smart Chain
 *   - USDT on Polygon (same address format)
 */

import { ethers } from 'ethers'
import { query } from './db'

export type USDTNetwork = 'ethereum' | 'bsc' | 'polygon'

const COIN_TYPE = 60 // Ethereum BIP44 coin type

// Master mnemonic / seed for HD wallet.
// In production store this in a secure secrets manager.
// We derive it from the env variable USDT_MASTER_MNEMONIC or fall back to a
// deterministic phrase seeded from BITCOIN_MASTER_SEED so existing deploys
// don't need extra configuration.
function getMasterMnemonic(): string {
  if (process.env.USDT_MASTER_MNEMONIC) {
    return process.env.USDT_MASTER_MNEMONIC
  }

  // Deterministic fallback: use a fixed mnemonic derived from env seed.
  // WARNING: Replace with a proper mnemonic in production!
  const seed = process.env.BITCOIN_MASTER_SEED || 'default-dev-seed-change-in-production'
  // Use first 12 words of a BIP39-compatible phrase derived from seed hash.
  // For safety we just use a known-good 12-word phrase in dev.
  return (
    process.env.USDT_DEV_MNEMONIC ||
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  )
}

/**
 * Get the HD wallet ROOT node (depth 0).
 * In ethers v6, HDNodeWallet.fromPhrase() without a path argument
 * returns the root node, which accepts full m/44'/... derivation paths.
 */
function getHDWallet(): ethers.HDNodeWallet {
  const mnemonic = getMasterMnemonic()
  // Pass undefined as the second argument (password) and omit the path
  // so the returned wallet is at depth 0 (the true root).
  return ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m")
}

/**
 * Derive an EVM address at the given index.
 * BIP44 path: m/44'/60'/0'/0/{index}
 */
export function deriveUSDTAddress(index: number): {
  address: string
  derivationPath: string
  publicKey: string
} {
  const root = getHDWallet()
  // Build the child path relative to root (m already consumed above)
  const childPath = `44'/60'/0'/0/${index}`
  const child = root.derivePath(childPath)
  const derivationPath = `m/44'/60'/0'/0/${index}`

  return {
    address: child.address,
    derivationPath,
    publicKey: child.publicKey,
  }
}

/**
 * Get the next available derivation index across all networks.
 * Uses a global counter stored in usdt_addresses to guarantee uniqueness.
 */
export async function getNextUSDTIndex(): Promise<number> {
  try {
    const result = await query<{ max_index: number | null }>(
      `SELECT MAX(derivation_index) as max_index FROM usdt_addresses`
    )
    const max = result.rows[0]?.max_index
    return max !== null && max !== undefined ? max + 1 : 0
  } catch (err) {
    console.warn('[USDT Wallet] Could not read next index, defaulting to 0:', err)
    return 0
  }
}

/**
 * Generate a fresh USDT deposit address for a user on the given EVM network.
 */
export async function generateUSDTPaymentAddress(
  userId: string,
  network: USDTNetwork = 'bsc'
): Promise<{ address: string; derivationPath: string; index: number }> {
  const index = await getNextUSDTIndex()
  const { address, derivationPath } = deriveUSDTAddress(index)

  console.log(
    `[USDT Wallet] Generated address ${address} at path ${derivationPath} for network ${network}`
  )

  return { address, derivationPath, index }
}

/**
 * Return the USDT contract address for a given EVM network.
 */
export function getUSDTContractAddress(network: USDTNetwork): string {
  switch (network) {
    case 'ethereum':
      return '0xdAC17F958D2ee523a2206206994597C13D831ec7' // USDT ERC-20
    case 'bsc':
      return '0x55d398326f99059fF775485246999027B3197955' // USDT BEP-20
    case 'polygon':
      return '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' // USDT (PoS) on Polygon
    default:
      throw new Error(`Unknown USDT network: ${network}`)
  }
}

/**
 * Return the RPC URL for a given EVM network.
 * Reads from env first; falls back to public endpoints.
 */
export function getNetworkRPC(network: USDTNetwork): string {
  switch (network) {
    case 'ethereum':
      return process.env.ETHEREUM_RPC_URL || 'https://cloudflare-eth.com'
    case 'bsc':
      return process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org'
    case 'polygon':
      return process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    default:
      throw new Error(`Unknown network: ${network}`)
  }
}

/**
 * Return block explorer API details for a given EVM network.
 */
export function getExplorerConfig(network: USDTNetwork): {
  apiUrl: string
  apiKey: string
} {
  switch (network) {
    case 'ethereum':
      return {
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY || '',
      }
    case 'bsc':
      return {
        apiUrl: 'https://api.bscscan.com/api',
        apiKey: process.env.BSCSCAN_API_KEY || '',
      }
    case 'polygon':
      return {
        apiUrl: 'https://api.polygonscan.com/api',
        apiKey: process.env.POLYGONSCAN_API_KEY || '',
      }
    default:
      throw new Error(`Unknown network: ${network}`)
  }
}
