import { NextRequest, NextResponse } from 'next/server'
import { getTransactionHistory } from '@/lib/wallet'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1).max(100).optional()
  ),
  offset: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0).optional()
  ),
  type: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  startDate: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : new Date(val as string)),
    z.date().optional()
  ),
  endDate: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : new Date(val as string)),
    z.date().optional()
  ),
})

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData: any = {}
    
    // Only include parameters that are present and not null
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (limit !== null) queryData.limit = limit
    if (offset !== null) queryData.offset = offset
    if (type !== null) queryData.type = type
    if (status !== null) queryData.status = status
    if (startDate !== null) queryData.startDate = startDate
    if (endDate !== null) queryData.endDate = endDate

    const validated = querySchema.safeParse(queryData)
    if (!validated.success) {
      console.error('Query validation error:', validated.error.errors)
      return addSecurityHeaders(
        errorResponse(new Error('Invalid query parameters'), 400)
      )
    }

    // Get transaction history
    const history = await getTransactionHistory(session.userId, validated.data)

    const response = successResponse(history)
    return addSecurityHeaders(response)
  } catch (error) {
    const response = errorResponse(error)
    return addSecurityHeaders(response)
  }
}

