/**
 * Payment Status Check API
 * Checks payment status and updates deposit if payment detected
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession, getUserById } from '@/lib/auth'
import { checkPaymentStatus } from '@/lib/payment-detection'
import { queryOne } from '@/lib/db'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { z } from 'zod'

const statusCheckSchema = z.object({
  depositId: z.string().min(1),
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
 * POST /api/payments/status
 * Check payment status and update if payment detected
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
    const validation = statusCheckSchema.safeParse(body)

    if (!validation.success) {
      return addSecurityHeaders(
        errorResponse(
          new ValidationError('Invalid request data', validation.error.errors),
          400
        )
      )
    }

    const { depositId } = validation.data

    // Verify deposit belongs to user
    const deposit = await queryOne<{
      id: string
      user_id: string
    }>(`SELECT id, user_id FROM deposits WHERE id = ?`, [depositId])

    if (!deposit) {
      return addSecurityHeaders(
        errorResponse(new ValidationError('Deposit not found'), 404)
      )
    }

    if (deposit.user_id !== user.id) {
      return addSecurityHeaders(
        errorResponse(new UnauthorizedError('Unauthorized'), 403)
      )
    }

    // Check payment status
    const status = await checkPaymentStatus(depositId)

    return addSecurityHeaders(
      successResponse({
        depositId,
        hasPayment: status.hasPayment,
        confirmed: status.confirmed,
        confirmations: status.confirmations,
        txHash: status.txHash,
        amount: status.amount,
      })
    )
  } catch (error: any) {
    console.error('Error checking payment status:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}








