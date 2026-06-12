/**
 * Native ETH On-Chain API Client
 * Uses Etherscan API to detect incoming native ETH transfers to a monitored address.
 *
 * For native ETH, we use the `txlist` endpoint rather than event logs.
 */

import { getExplorerConfig } from './usdt-wallet'

// ETH uses 18 decimals
const ETH_DECIMALS = 18

export interface ETHTransfer {
  txHash: string
  from: string
  to: string
  value: number      // ETH amount (human-readable, e.g. 1.5)
  blockNumber: number
  blockTime: number
  confirmations: number
}

export interface ETHAddressStatus {
  hasTransfers: boolean
  totalReceived: number   // ETH amount
  transfers: ETHTransfer[]
}

/**
 * Convert raw wei (18-decimal integer string) to a human-readable float
 */
function fromWei(raw: string): number {
  return parseFloat(raw) / Math.pow(10, ETH_DECIMALS)
}

/**
 * Get the latest block number for Ethereum via the explorer API
 */
export async function getCurrentBlock(): Promise<number> {
  const { apiUrl, apiKey } = getExplorerConfig('ethereum')

  const params = new URLSearchParams({
    module: 'proxy',
    action: 'eth_blockNumber',
  })
  if (apiKey) params.append('apikey', apiKey)

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`)
    const json = await res.json()
    return parseInt(json.result, 16)
  } catch {
    return 0
  }
}

/**
 * Fetch incoming native ETH transfers to `address` from the Etherscan API.
 */
export async function getETHTransfers(
  address: string,
  fromBlock: number = 0
): Promise<ETHTransfer[]> {
  const { apiUrl, apiKey } = getExplorerConfig('ethereum')

  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address: address,
    startblock: fromBlock.toString(),
    endblock: '99999999',
    page: '1',
    offset: '50',
    sort: 'asc',
  })

  if (apiKey) {
    params.append('apikey', apiKey)
  }

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`Explorer API error: ${res.statusText}`)
    }

    const json = await res.json()

    if (json.status === '0') {
      // "No transactions found" is normal; other codes are errors
      if (json.message !== 'No transactions found') {
        console.warn(`[ETH API] Explorer returned error: ${json.message}`)
      }
      return []
    }

    const txs: any[] = json.result || []
    
    // Fetch current block for confirmation count if not provided by txlist reliably
    const currentBlock = await getCurrentBlock()

    return txs
      // Only include successful incoming transactions with value > 0
      .filter(tx => 
        tx.to.toLowerCase() === address.toLowerCase() && 
        tx.isError === '0' &&
        BigInt(tx.value) > 0n
      )
      .map((tx) => {
        const blockNumber = parseInt(tx.blockNumber, 10)
        return {
          txHash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: fromWei(tx.value),
          blockNumber,
          blockTime: parseInt(tx.timeStamp, 10),
          confirmations: Math.max(0, currentBlock - blockNumber + 1),
        } as ETHTransfer
      })
  } catch (err) {
    console.error('[ETH API] Failed to fetch transfers:', err)
    return []
  }
}

/**
 * Check if an address has received any native ETH and aggregate results.
 */
export async function checkETHAddressForPayments(
  address: string,
  fromBlock: number = 0
): Promise<ETHAddressStatus> {
  const transfers = await getETHTransfers(address, fromBlock)

  const totalReceived = transfers.reduce((sum, t) => sum + t.value, 0)

  return {
    hasTransfers: transfers.length > 0,
    totalReceived,
    transfers,
  }
}
