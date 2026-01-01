/**
 * Bitcoin API Client
 * Uses Blockstream API (free, no authentication required)
 * Supports both mainnet and testnet
 */

export type BitcoinNetwork = 'mainnet' | 'testnet'

interface BlockstreamAddressInfo {
  address: string
  chain_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
  mempool_stats: {
    funded_txo_count: number
    funded_txo_sum: number
    spent_txo_count: number
    spent_txo_sum: number
    tx_count: number
  }
}

interface BlockstreamTransaction {
  txid: string
  version: number
  locktime: number
  vin: Array<{
    txid: string
    vout: number
    prevout: {
      scriptpubkey: string
      scriptpubkey_asm: string
      scriptpubkey_type: string
      scriptpubkey_address: string
      value: number
    }
    scriptsig: string
    scriptsig_asm: string
    witness?: string[]
    is_coinbase: boolean
    sequence: number
  }>
  vout: Array<{
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address: string
    value: number
  }>
  fee: number
  status: {
    confirmed: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
}

interface BlockstreamAddressTransactions {
  txid: string
  version: number
  locktime: number
  vin: Array<{
    txid: string
    vout: number
    prevout: {
      scriptpubkey: string
      scriptpubkey_asm: string
      scriptpubkey_type: string
      scriptpubkey_address: string
      value: number
    }
    scriptsig: string
    scriptsig_asm: string
    witness?: string[]
    is_coinbase: boolean
    sequence: number
  }>
  vout: Array<{
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address: string
    value: number
  }>
  fee: number
  status: {
    confirmed: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
}

class BitcoinAPI {
  private baseUrl: string
  private network: BitcoinNetwork
  private maxRetries: number = 3
  private retryDelay: number = 1000 // 1 second

  constructor(network: BitcoinNetwork = 'testnet') {
    this.network = network
    this.baseUrl = network === 'mainnet'
      ? 'https://blockstream.info/api'
      : 'https://blockstream.info/testnet/api'
  }

  /**
   * Get API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Get current network
   */
  getNetwork(): BitcoinNetwork {
    return this.network
  }

  /**
   * Retry logic for API calls
   */
  private async retry<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.retry(fn, retries - 1)
      }
      throw error
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/blocks/tip/height`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      return response.ok
    } catch (error) {
      console.error('Bitcoin API health check failed:', error)
      return false
    }
  }

  /**
   * Get address information
   */
  async getAddressInfo(address: string): Promise<BlockstreamAddressInfo> {
    return this.retry(async () => {
      const response = await fetch(`${this.baseUrl}/address/${address}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch address info: ${response.statusText}`)
      }

      return response.json()
    })
  }

  /**
   * Get address transactions
   */
  async getAddressTransactions(
    address: string,
    limit: number = 25
  ): Promise<BlockstreamAddressTransactions[]> {
    return this.retry(async () => {
      const response = await fetch(
        `${this.baseUrl}/address/${address}/txs?limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }

      return response.json()
    })
  }

  /**
   * Get transaction details
   */
  async getTransaction(txid: string): Promise<BlockstreamTransaction> {
    return this.retry(async () => {
      const response = await fetch(`${this.baseUrl}/tx/${txid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`)
      }

      return response.json()
    })
  }

  /**
   * Get transaction confirmation count
   */
  async getTransactionConfirmations(txid: string): Promise<number> {
    try {
      const tx = await this.getTransaction(txid)
      if (!tx.status.confirmed) {
        return 0
      }

      // Get current block height
      const currentHeightResponse = await fetch(
        `${this.baseUrl}/blocks/tip/height`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!currentHeightResponse.ok) {
        return 0
      }

      const currentHeight = await currentHeightResponse.json()
      const blockHeight = tx.status.block_height || 0

      return Math.max(0, currentHeight - blockHeight + 1)
    } catch (error) {
      console.error('Error getting transaction confirmations:', error)
      return 0
    }
  }

  /**
   * Check if address has received payments
   */
  async checkAddressForPayments(address: string): Promise<{
    hasPayments: boolean
    totalReceived: number // in satoshis
    transactions: BlockstreamAddressTransactions[]
  }> {
    try {
      const addressInfo = await this.getAddressInfo(address)
      const transactions = await this.getAddressTransactions(address, 10)

      // Calculate total received (in satoshis)
      const totalReceived =
        addressInfo.chain_stats.funded_txo_sum +
        addressInfo.mempool_stats.funded_txo_sum

      return {
        hasPayments: totalReceived > 0,
        totalReceived,
        transactions,
      }
    } catch (error) {
      console.error('Error checking address for payments:', error)
      return {
        hasPayments: false,
        totalReceived: 0,
        transactions: [],
      }
    }
  }

  /**
   * Convert satoshis to BTC
   */
  satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000
  }

  /**
   * Convert BTC to satoshis
   */
  btcToSatoshis(btc: number): number {
    return Math.round(btc * 100000000)
  }
}

// Export singleton instance
export const bitcoinAPI = new BitcoinAPI(
  (process.env.BITCOIN_NETWORK as BitcoinNetwork) || 'testnet'
)

export default BitcoinAPI



