/**
 * USDT Deposit API
 * POST /api/payments/usdt-deposit
 *
 * Creates a new USDT deposit request and returns a unique EVM address
 * for the user to send USDT to (ERC-20 / BEP-20 / Polygon).
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { getSession, getUserById } from '@/lib/auth'
import { query } from '@/lib/db'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { createUSDTPaymentAddress, USDTNetwork } from '@/lib/usdt-address'
import { startUSDTPaymentMonitoring } from '@/lib/usdt-detection'
import { getUSDTContractAddress } from '@/lib/usdt-wallet'
import { generateQRCodeDataURL } from '@/lib/bitcoin-qr'

// ── Validation schema ─────────────────────────────────────────────────────────
const depositSchema = z.object({
  /** Amount in the user's local currency (e.g. EUR, USD) */
  amount: z.number().positive().min(1),
  currency: z.string().default('EUR'),
  /** Target EVM network */
  network: z.enum(['ethereum', 'bsc', 'polygon']).default('bsc'),
})

// ── Rough fiat → USDT conversion (USDT ≈ 1 USD) ─────────────────────────────
// For production use a live rate service. EUR ≈ 0.10 USD historically.
const FIAT_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.10,
  EUR: 1.08,
}

function toUSDT(amount: number, currency: string): number {
  const rate = FIAT_TO_USD[currency.toUpperCase()] ?? 1.08 // default to EUR rate
  return parseFloat((amount * rate).toFixed(6))
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const sessionToken = authHeader?.replace('Bearer ', '')
  if (!sessionToken) return null

  const session = await getSession(sessionToken)
  if (!session) return null

  const user = await getUserById(session.userId)
  if (!user || !user.is_active) return null

  return user
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult)

    // Auth
    const user = await getAuthUser(request)
    if (!user) {
      return addSecurityHeaders(errorResponse(new UnauthorizedError('Unauthorized'), 401))
    }

    // Parse body
    const body = await request.json()
    const validation = depositSchema.safeParse(body)
    if (!validation.success) {
      return addSecurityHeaders(
        errorResponse(new ValidationError('Invalid request data', validation.error.errors), 400)
      )
    }

    const { amount, currency, network } = validation.data
    const usdtAmount = toUSDT(amount, currency)

    // Expiry: 30 minutes
    const depositId = nanoid()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Generate unique EVM address for this deposit
    const paymentAddress = await createUSDTPaymentAddress(
      user.id,
      null, // linked after deposit row is created
      network as USDTNetwork,
      30
    )

    // USDT contract for the selected network
    const contractAddress = getUSDTContractAddress(network as USDTNetwork)

    // Build a simple EIP-681 payment URL so wallets can prefill the recipient
    // Format: ethereum:<contract>/transfer?address=<recipient>&uint256=<raw_amount>
    const rawAmount = BigInt(Math.round(usdtAmount * 1_000_000)).toString() // 6 decimals
    const paymentURL = `ethereum:${contractAddress}/transfer?address=${paymentAddress.address}&uint256=${rawAmount}`

    // Create deposit record
    await query(
      `INSERT INTO deposits (
        id, user_id, amount, currency, method, network,
        address, usdt_amount, token_type, status, expires_at,
        required_confirmations, payment_url, created_at
      ) VALUES (?, ?, ?, ?, 'usdt', ?, ?, ?, 'usdt', 'pending', ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        depositId,
        user.id,
        amount,
        currency,
        network,
        paymentAddress.address,
        usdtAmount,
        expiresAt.toISOString(),
        network === 'ethereum' ? 12 : 15,
        paymentURL,
      ]
    )

    // Link address record to deposit
    await query(
      `UPDATE usdt_addresses SET deposit_id = ? WHERE id = ?`,
      [depositId, paymentAddress.id]
    )

    // Start blockchain monitoring
    await startUSDTPaymentMonitoring(depositId, paymentAddress.address, network as USDTNetwork)

    // Generate QR code (encode the EIP-681 URL)
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
        usdtAmount,
        network,
        contractAddress,
        paymentURL,
        qrCode,
        expiresAt: expiresAt.toISOString(),
        instructions: [
          `Send exactly ${usdtAmount} USDT to the address above`,
          `Network: ${network.toUpperCase()} — use only the ${network.toUpperCase()} network`,
          'Sending on the wrong network will result in permanent loss of funds',
          'Payment will be credited after the required confirmations',
        ],
      })
    )
  } catch (error: any) {
    console.error('[USDT Deposit] Error creating deposit:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}

// ── GET handler – fetch a single deposit's status ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult)

    const user = await getAuthUser(request)
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
      usdt_amount: number | null
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
        usdtAmount: d.usdt_amount,
        address: d.address,
        txHash: d.tx_hash,
        status: d.status,
        confirmations: d.confirmations ?? 0,
        requiredConfirmations: d.required_confirmations ?? 15,
        expiresAt: d.expires_at,
        network: d.network,
        tokenType: d.token_type,
        createdAt: d.created_at,
      })
    )
  } catch (error: any) {
    console.error('[USDT Deposit] Error fetching deposit:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}
