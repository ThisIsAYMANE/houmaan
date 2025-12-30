import { NextRequest } from 'next/server'
import { generateNonce } from '@/lib/wallet-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { z } from 'zod'

const nonceRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = nonceRequestSchema.safeParse(body)

    if (!validated.success) {
      return errorResponse(new Error('Invalid wallet address'), 400)
    }

    const { walletAddress } = validated.data
    
    try {
      const nonce = await generateNonce(walletAddress)
      return successResponse({ nonce })
    } catch (error: any) {
      console.error('Nonce generation error:', error)
      
      // Provide helpful error message if migration not run
      if (error.message && error.message.includes('no such column: wallet_address')) {
        return errorResponse(
          new Error('Wallet authentication not configured. Database migration required.'),
          500
        )
      }
      
      return errorResponse(error)
    }
  } catch (error) {
    console.error('Nonce API error:', error)
    return errorResponse(error)
  }
}

