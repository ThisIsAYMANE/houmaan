import { NextRequest, NextResponse } from 'next/server'
import { getWalletBalance } from '@/lib/wallet'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) {
      return addSecurityHeaders(rateLimitResult)
    }

    // Authentication
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!sessionToken) {
      return addSecurityHeaders(
        errorResponse(new UnauthorizedError('Authentication required'), 401)
      )
    }

    const session = await getSession(sessionToken)
    if (!session) {
      return addSecurityHeaders(
        errorResponse(new UnauthorizedError('Invalid session'), 401)
      )
    }

    // Get wallet balance
    const balance = await getWalletBalance(session.userId)

    const response = successResponse(balance)
    return addSecurityHeaders(response)
  } catch (error) {
    const response = errorResponse(error)
    return addSecurityHeaders(response)
  }
}








