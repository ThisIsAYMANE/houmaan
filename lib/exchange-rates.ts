/**
 * Exchange Rate Service
 * Fetches and caches Bitcoin exchange rates from CoinGecko API
 */

import { query, queryOne } from './db'
import { v4 as uuidv4 } from 'uuid'

interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  source: string
  cached_at: Date
  expires_at: Date
}

const CACHE_DURATION_MINUTES = 5 // Cache rates for 5 minutes
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

/**
 * Get exchange rate from cache or API
 */
export async function getExchangeRate(
  fromCurrency: string = 'usd',
  toCurrency: string = 'btc'
): Promise<number> {
  // Normalize currencies
  const from = fromCurrency.toLowerCase()
  const to = toCurrency.toLowerCase()

  // Check cache first
  const cached = await queryOne<ExchangeRate>(
    `SELECT * FROM exchange_rates 
     WHERE from_currency = ? AND to_currency = ? 
     AND expires_at > CURRENT_TIMESTAMP
     ORDER BY cached_at DESC
     LIMIT 1`,
    [from, to]
  )

  if (cached) {
    return cached.rate
  }

  // Fetch from API
  const rate = await fetchExchangeRateFromAPI(from, to)

  // Cache the rate
  await cacheExchangeRate(from, to, rate, 'coingecko')

  return rate
}

/**
 * Fetch exchange rate from CoinGecko API
 */
async function fetchExchangeRateFromAPI(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    // CoinGecko uses different IDs
    const coinId = toCurrency === 'btc' ? 'bitcoin' : toCurrency
    const vsCurrency = fromCurrency === 'btc' ? 'usd' : fromCurrency

    // If converting from BTC to USD
    if (fromCurrency === 'btc' && toCurrency === 'usd') {
      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.bitcoin.usd
    }

    // If converting from USD to BTC
    if (fromCurrency === 'usd' && toCurrency === 'btc') {
      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`)
      }

      const data = await response.json()
      const btcPriceInUSD = data.bitcoin.usd
      return 1 / btcPriceInUSD // Convert USD to BTC
    }

    // For other conversions, use the direct endpoint
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data[coinId]?.[vsCurrency] || 0
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    // Return a fallback rate (you might want to use a more sophisticated fallback)
    throw new Error('Failed to fetch exchange rate')
  }
}

/**
 * Cache exchange rate
 */
async function cacheExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  source: string = 'coingecko'
): Promise<void> {
  const id = uuidv4()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + CACHE_DURATION_MINUTES)

  await query(
    `INSERT INTO exchange_rates (id, from_currency, to_currency, rate, source, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, fromCurrency, toCurrency, rate, source, expiresAt.toISOString()]
  )
}

/**
 * Convert USD to BTC
 */
export async function usdToBTC(usdAmount: number): Promise<number> {
  const rate = await getExchangeRate('usd', 'btc')
  return usdAmount * rate
}

/**
 * Convert BTC to USD
 */
export async function btcToUSD(btcAmount: number): Promise<number> {
  const rate = await getExchangeRate('btc', 'usd')
  return btcAmount * rate
}

/**
 * Clean up expired exchange rate cache
 */
export async function cleanupExpiredRates(): Promise<number> {
  const result = await query(
    `DELETE FROM exchange_rates WHERE expires_at < CURRENT_TIMESTAMP`
  )

  return result.rowCount
}







