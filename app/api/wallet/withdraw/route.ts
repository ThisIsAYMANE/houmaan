import { NextRequest, NextResponse } from 'next/server'
import { processWithdrawal } from '@/lib/wallet'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { rateLimiters } from '@/middleware/rate-limit'
import { addSecurityHeaders } from '@/middleware/security-headers'
import { z } from 'zod'

const withdrawalSchema = z.object({
  amount: z.number().min(10),
  currency: z.string().default('EUR'),
  toAddress: z.string().min(10),
  network: z.string(),
  tokenType: z.string(),
  type: z.literal('withdrawal')
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.standard(request)
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult)

    // Auth
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!sessionToken) return addSecurityHeaders(errorResponse(new UnauthorizedError('Authentication required'), 401))

    const session = await getSession(sessionToken)
    if (!session) return addSecurityHeaders(errorResponse(new UnauthorizedError('Invalid session'), 401))

    const body = await request.json()
    const validated = withdrawalSchema.safeParse(body)
    
    if (!validated.success) {
      return addSecurityHeaders(errorResponse(new Error('Invalid withdrawal parameters'), 400))
    }

    const { amount, toAddress, network, tokenType } = validated.data
    
    // Process the withdrawal
    const result = await processWithdrawal(session.userId, amount, toAddress, network, tokenType)
    
    return addSecurityHeaders(successResponse(result))
  } catch (error) {
    return addSecurityHeaders(errorResponse(error))
  }
}
