/**
 * USDT On-Chain API Client
 * Uses block-explorer APIs (Etherscan / BscScan / PolygonScan) to detect
 * incoming USDT ERC-20 / BEP-20 / Polygon transfers to a monitored address.
 *
 * All APIs share the same query format; only the base URL and API key differ.
 * Free tier allows ~5 requests/second which is enough for polling.
 *
 * ERC-20 Transfer event topic:
 *   keccak256("Transfer(address,address,uint256)")
 *   = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 */

import { getUSDTContractAddress, getExplorerConfig, USDTNetwork } from './usdt-wallet'

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// USDT uses 6 decimals on all EVM networks
const USDT_DECIMALS = 6

export interface USDTTransfer {
  txHash: string
  from: string
  to: string
  value: number      // USDT amount (human-readable, e.g. 50.00)
  blockNumber: number
  blockTime: number
  confirmations: number
}

export interface USDTAddressStatus {
  hasTransfers: boolean
  totalReceived: number   // USDT amount
  transfers: USDTTransfer[]
}

/**
 * Convert raw token amount (6-decimal integer string) to a human-readable float
 */
function fromRawUSDT(raw: string): number {
  return parseInt(raw, 10) / Math.pow(10, USDT_DECIMALS)
}

/**
 * Pad an EVM address to 32-byte topic format (for log filtering)
 */
function addressToTopic(address: string): string {
  // Remove 0x, pad to 64 hex chars
  return '0x' + address.replace('0x', '').toLowerCase().padStart(64, '0')
}

/**
 * Fetch incoming USDT transfers to `address` from the block explorer API.
 * Uses the `getLogs` endpoint for reliability across all EVM chains.
 */
export async function getUSDTTransfers(
  address: string,
  network: USDTNetwork,
  fromBlock: number = 0
): Promise<USDTTransfer[]> {
  const contract = getUSDTContractAddress(network)
  const { apiUrl, apiKey } = getExplorerConfig(network)

  const toTopic = addressToTopic(address)

  const params = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    address: contract,
    topic0: TRANSFER_TOPIC,
    topic2: toTopic,       // topic2 = "to" address in ERC-20 Transfer
    topic0_2_opr: 'and',
    fromBlock: fromBlock.toString(),
    toBlock: 'latest',
    page: '1',
    offset: '50',
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
      if (json.message !== 'No records found' && json.message !== 'No logs found in result') {
        console.warn(`[USDT API] Explorer returned error: ${json.message}`)
      }
      return []
    }

    const logs: any[] = json.result || []

    // Fetch current block for confirmation count
    const currentBlock = await getCurrentBlock(network)

    return logs.map((log) => {
      const blockNumber = parseInt(log.blockNumber, 16)
      return {
        txHash: log.transactionHash,
        from: '0x' + log.topics[1].slice(26), // strip padding from topic1
        to: '0x' + log.topics[2].slice(26),   // strip padding from topic2
        value: fromRawUSDT(BigInt(log.data).toString()),
        blockNumber,
        blockTime: parseInt(log.timeStamp, 16),
        confirmations: Math.max(0, currentBlock - blockNumber + 1),
      } as USDTTransfer
    })
  } catch (err) {
    console.error('[USDT API] Failed to fetch transfers:', err)
    return []
  }
}

/**
 * Get the latest block number for a network via the explorer API
 */
export async function getCurrentBlock(network: USDTNetwork): Promise<number> {
  const { apiUrl, apiKey } = getExplorerConfig(network)

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
 * Check if an address has received any USDT and aggregate results.
 */
export async function checkUSDTAddressForPayments(
  address: string,
  network: USDTNetwork,
  fromBlock: number = 0
): Promise<USDTAddressStatus> {
  const transfers = await getUSDTTransfers(address, network, fromBlock)

  const inbound = transfers.filter(
    (t) => t.to.toLowerCase() === address.toLowerCase()
  )

  const totalReceived = inbound.reduce((sum, t) => sum + t.value, 0)

  return {
    hasTransfers: inbound.length > 0,
    totalReceived,
    transfers: inbound,
  }
}

/**
 * Get confirmation count for a specific transaction
 */
export async function getUSDTTxConfirmations(
  txHash: string,
  network: USDTNetwork
): Promise<number> {
  const { apiUrl, apiKey } = getExplorerConfig(network)

  const params = new URLSearchParams({
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: txHash,
  })
  if (apiKey) params.append('apikey', apiKey)

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`)
    const json = await res.json()

    if (!json.result?.blockNumber) return 0

    const txBlock = parseInt(json.result.blockNumber, 16)
    const currentBlock = await getCurrentBlock(network)

    return Math.max(0, currentBlock - txBlock + 1)
  } catch {
    return 0
  }
}
