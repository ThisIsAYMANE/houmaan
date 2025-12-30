/**
 * Bitcoin Deposit API
 * Creates a new deposit request and generates a payment address
 */

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { createPaymentAddress } from '@/lib/bitcoin-address'
import { generatePaymentQRCode, generateBIP21URL } from '@/lib/bitcoin-qr'
import { usdToBTC } from '@/lib/exchange-rates'
import { startPaymentMonitoring } from '@/lib/payment-detection'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { getSession, getUserById } from '@/lib/auth'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'

const depositSchema = z.object({
  amount: z.number().positive().min(0.01),
  currency: z.string().default('MAD'),
  network: z.enum(['mainnet', 'testnet']).default('testnet'),
})

/**
 * Helper to get authenticated user
 */
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const sessionToken = authHeader?.replace('Bearer ', '')

  if (!sessionToken) {
    return null
  }

  const session = await getSession(sessionToken)
  if (!session) {
    return null
  }

  const user = await getUserById(session.userId)
  if (!user || !user.is_active) {
    return null
  }

  return user
}

/**
 * POST /api/payments/deposit
 * Create a new Bitcoin deposit
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) {
      return addSecurityHeaders(rateLimitResult)
    }

    // Authentication
    const user = await getAuthUser(request)
    if (!user) {
      return addSecurityHeaders(
        errorResponse(new UnauthorizedError('Unauthorized'), 401)
      )
    }

    // Parse request body
    const body = await request.json()
    const validation = depositSchema.safeParse(body)

    if (!validation.success) {
      return addSecurityHeaders(
        errorResponse(
          new ValidationError('Invalid request data', validation.error.errors),
          400
        )
      )
    }

    const { amount, currency, network } = validation.data

    // Convert amount to BTC
    let btcAmount: number
    if (currency.toUpperCase() === 'BTC') {
      btcAmount = amount
    } else {
      // Convert from currency to USD first, then to BTC
      // For now, we'll use a simple conversion (you might want to enhance this)
      const usdAmount = currency.toUpperCase() === 'USD' ? amount : amount * 0.1 // Rough MAD to USD conversion
      btcAmount = await usdToBTC(usdAmount)
    }

    // Create deposit record
    const depositId = nanoid()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30 minutes expiration

    const requiredConfirmations = network === 'mainnet' ? 6 : 1

    // Generate payment address (without deposit_id first to avoid FK constraint)
    const paymentAddress = await createPaymentAddress(
      user.id,
      null, // deposit_id will be set after deposit is created
      network,
      30 // 30 minutes expiration
    )

    // Generate BIP21 payment URL
    const paymentURL = generateBIP21URL(paymentAddress.address, {
      amount: btcAmount,
      label: `Deposit ${amount} ${currency}`,
      message: `Payment for deposit ID: ${depositId}`,
      network,
    })

    // Create deposit record
    await query(
      `INSERT INTO deposits (
        id, user_id, amount, currency, method, network, 
        address, btc_amount, status, expires_at, 
        required_confirmations, payment_url, created_at
      ) VALUES (?, ?, ?, ?, 'bitcoin', ?, ?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        depositId,
        user.id,
        amount,
        currency,
        network,
        paymentAddress.address,
        btcAmount,
        expiresAt.toISOString(),
        requiredConfirmations,
        paymentURL,
      ]
    )

    // Update address record with deposit ID (now that deposit exists)
    await query(
      `UPDATE bitcoin_addresses SET deposit_id = ? WHERE id = ?`,
      [depositId, paymentAddress.id]
    )

    // Start payment monitoring
    await startPaymentMonitoring(depositId, paymentAddress.address)

    // Generate QR code
    const qrCodeDataURL = await generatePaymentQRCode(
      paymentAddress.address,
      btcAmount,
      {
        label: `Deposit ${amount} ${currency}`,
        network,
      }
    )

    const response = successResponse({
      depositId,
      address: paymentAddress.address,
      amount,
      currency,
      btcAmount,
      paymentURL,
      qrCode: qrCodeDataURL,
      expiresAt: expiresAt.toISOString(),
      requiredConfirmations,
      network,
    })

    return addSecurityHeaders(response)
  } catch (error: any) {
    console.error('Error creating deposit:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}

/**
 * GET /api/payments/deposit?depositId=xxx
 * Get deposit status
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) {
      return addSecurityHeaders(rateLimitResult)
    }

    // Authentication
    const user = await getAuthUser(request)
    if (!user) {
      return addSecurityHeaders(
        errorResponse(new UnauthorizedError('Unauthorized'), 401)
      )
    }

    const searchParams = request.nextUrl.searchParams
    const depositId = searchParams.get('depositId')

    if (!depositId) {
      return NextResponse.json(
        { error: 'depositId parameter is required' },
        { status: 400 }
      )
    }

    // Get deposit
    const deposit = await queryOne<{
      id: string
      user_id: string
      amount: number
      currency: string
      btc_amount: number | null
      address: string | null
      tx_hash: string | null
      status: string
      confirmations: number | null
      required_confirmations: number | null
      expires_at: string | null
      created_at: string
    }>(`SELECT * FROM deposits WHERE id = ? AND user_id = ?`, [
      depositId,
      user.id,
    ])

    if (!deposit) {
      return addSecurityHeaders(
        errorResponse(new ValidationError('Deposit not found'), 404)
      )
    }

    const response = successResponse({
      depositId: deposit.id,
      amount: deposit.amount,
      currency: deposit.currency,
      btcAmount: deposit.btc_amount,
      address: deposit.address,
      txHash: deposit.tx_hash,
      status: deposit.status,
      confirmations: deposit.confirmations || 0,
      requiredConfirmations: deposit.required_confirmations || 1,
      expiresAt: deposit.expires_at,
      createdAt: deposit.created_at,
    })

    return addSecurityHeaders(response)
  } catch (error: any) {
    console.error('Error fetching deposit:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}

