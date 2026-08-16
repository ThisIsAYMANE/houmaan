/**
 * ETH Deposit API
 * POST /api/payments/eth-deposit
 *
 * Creates a new native ETH deposit request and returns a unique EVM address.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { getRequestUser } from '@/lib/request-auth'
import { query } from '@/lib/db'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { createETHPaymentAddress } from '@/lib/eth-address'
import { startETHPaymentMonitoring } from '@/lib/eth-detection'
import { generateQRCodeDataURL } from '@/lib/bitcoin-qr'

// ── Validation schema ─────────────────────────────────────────────────────────
const depositSchema = z.object({
  amount: z.number().positive().min(1),
  currency: z.string().default('EUR'),
})

// ── Rough fiat → ETH conversion ───────────────────────────────────────────────
// For production use a live rate service (e.g., CoinGecko API).
// Currently assuming 1 ETH ≈ 3000 EUR
const FIAT_TO_ETH: Record<string, number> = {
  USD: 1 / 3200,
  EUR: 1 / 3000,
  MAD: 1 / 32000,
}

function toETH(amount: number, currency: string): number {
  const rate = FIAT_TO_ETH[currency.toUpperCase()] ?? (1 / 3000)
  return parseFloat((amount * rate).toFixed(6)) // 6 decimals is usually enough for UI
}

// ── Auth helper ───────────────────────────────────────────────────────────────


export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult)

    const user = await getRequestUser(request)
    if (!user) {
      return addSecurityHeaders(errorResponse(new UnauthorizedError('Unauthorized'), 401))
    }

    const body = await request.json()
    const validation = depositSchema.safeParse(body)
    if (!validation.success) {
      return addSecurityHeaders(
        errorResponse(new ValidationError('Invalid request data', validation.error.errors), 400)
      )
    }

    const { amount, currency } = validation.data
    const ethAmount = toETH(amount, currency)

    // Expiry: 30 minutes
    const depositId = nanoid()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Generate unique EVM address for native ETH
    const paymentAddress = await createETHPaymentAddress(
      user.id,
      null,
      30
    )

    // Build EIP-681 payment URL for native ETH
    // Format: ethereum:<address>[?value=<amount_in_wei>]
    const weiAmount = BigInt(Math.round(ethAmount * 1e18)).toString()
    const paymentURL = `ethereum:${paymentAddress.address}?value=${weiAmount}`

    // Create deposit record
    await query(
      `INSERT INTO deposits (
        id, user_id, amount, currency, method, network,
        address, eth_amount, token_type, status, expires_at,
        required_confirmations, payment_url, created_at
      ) VALUES (?, ?, ?, ?, 'eth', 'ethereum', ?, ?, 'eth', 'pending', ?, 12, ?, CURRENT_TIMESTAMP)`,
      [
        depositId,
        user.id,
        amount,
        currency,
        paymentAddress.address,
        ethAmount,
        expiresAt.toISOString(),
        paymentURL,
      ]
    )

    // Link address record to deposit
    await query(
      `UPDATE eth_addresses SET deposit_id = ? WHERE id = ?`,
      [depositId, paymentAddress.id]
    )

    // Start blockchain monitoring
    await startETHPaymentMonitoring(depositId, paymentAddress.address)

    // Generate QR code
    let qrCode: string | null = null
    try {
      qrCode = await generateQRCodeDataURL(paymentURL, { width: 256 })
    } catch {
      // QR failure is non-fatal
    }

    return addSecurityHeaders(
      successResponse({
        depositId,
        address: paymentAddress.address,
        amount,
        currency,
        ethAmount,
        network: 'ethereum',
        paymentURL,
        qrCode,
        expiresAt: expiresAt.toISOString(),
        instructions: [
          `Send exactly ${ethAmount} ETH to the address above`,
          `Network: ETHEREUM (ERC-20 / Native)`,
          'Sending on the wrong network will result in permanent loss of funds',
          'Payment will be credited after 12 confirmations',
        ],
      })
    )
  } catch (error: any) {
    console.error('[ETH Deposit] Error creating deposit:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}

// ── GET handler – fetch a single deposit's status ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult)

    const user = await getRequestUser(request)
    if (!user) {
      return addSecurityHeaders(errorResponse(new UnauthorizedError('Unauthorized'), 401))
    }

    const depositId = request.nextUrl.searchParams.get('depositId')
    if (!depositId) {
      return addSecurityHeaders(
        errorResponse(new ValidationError('depositId parameter is required'), 400)
      )
    }

    const deposit = await query<{
      id: string
      user_id: string
      amount: number
      currency: string
      eth_amount: number | null
      address: string | null
      tx_hash: string | null
      status: string
      confirmations: number | null
      required_confirmations: number | null
      expires_at: string | null
      network: string | null
      token_type: string | null
      created_at: string
    }>(`SELECT * FROM deposits WHERE id = ? AND user_id = ?`, [depositId, user.id])

    if (!deposit.rows.length) {
      return addSecurityHeaders(errorResponse(new ValidationError('Deposit not found'), 404))
    }

    const d = deposit.rows[0]

    return addSecurityHeaders(
      successResponse({
        depositId: d.id,
        amount: d.amount,
        currency: d.currency,
        ethAmount: d.eth_amount,
        address: d.address,
        txHash: d.tx_hash,
        status: d.status,
        confirmations: d.confirmations ?? 0,
        requiredConfirmations: d.required_confirmations ?? 12,
        expiresAt: d.expires_at,
        network: d.network,
        tokenType: d.token_type,
        createdAt: d.created_at,
      })
    )
  } catch (error: any) {
    console.error('[ETH Deposit] Error fetching deposit:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}
