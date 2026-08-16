/**
 * USDT Payment Status API
 * POST /api/payments/usdt-status
 *
 * Triggers an immediate on-chain check for a USDT deposit and returns
 * the current payment status. The frontend polls this every 15–30 s.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getSession, getUserById } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { checkUSDTPaymentStatus } from '@/lib/usdt-detection'

const schema = z.object({
  depositId: z.string().min(1),
})

import { getRequestUser } from '@/lib/request-auth'


export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult)

    const user = await getRequestUser(request)
    if (!user) {
      return addSecurityHeaders(errorResponse(new UnauthorizedError('Unauthorized'), 401))
    }

    const body = await request.json()
    const validation = schema.safeParse(body)
    if (!validation.success) {
      return addSecurityHeaders(
        errorResponse(new ValidationError('Invalid request data', validation.error.errors), 400)
      )
    }

    const { depositId } = validation.data

    // Verify ownership
    const deposit = await queryOne<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM deposits WHERE id = ?`,
      [depositId]
    )

    if (!deposit) {
      return addSecurityHeaders(errorResponse(new ValidationError('Deposit not found'), 404))
    }

    if (deposit.user_id !== user.id) {
      return addSecurityHeaders(errorResponse(new UnauthorizedError('Unauthorized'), 403))
    }

    // Trigger on-chain check
    const status = await checkUSDTPaymentStatus(depositId)

    return addSecurityHeaders(
      successResponse({
        depositId,
        hasPayment: status.hasPayment,
        confirmed: status.confirmed,
        confirmations: status.confirmations,
        txHash: status.txHash,
        usdtAmount: status.amount,
      })
    )
  } catch (error: any) {
    console.error('[USDT Status] Error checking status:', error)
    return addSecurityHeaders(errorResponse(error))
  }
}
