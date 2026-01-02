import { NextRequest } from 'next/server'
import { verifyWalletSignature, getOrCreateWalletUser, createSession } from '@/lib/wallet-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { z } from 'zod'
import { getUserById } from '@/lib/auth'

const verifyRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string(),
  nonce: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = verifyRequestSchema.safeParse(body)

    if (!validated.success) {
      throw new ValidationError('Invalid verification data', validated.error.errors)
    }

    const { walletAddress, signature, nonce } = validated.data

    // Verify signature
    const verification = await verifyWalletSignature(walletAddress, signature, nonce)

    if (!verification) {
      throw new UnauthorizedError('Invalid signature or expired nonce')
    }

    // Ensure user exists (should already exist from nonce generation)
    const userId = await getOrCreateWalletUser(walletAddress)

    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    // Create session
    const sessionToken = await createSession(userId)

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        vipLevel: user.vip_level,
        walletAddress,
      },
      sessionToken,
      isNewUser: verification.isNewUser,
    })
  } catch (error) {
    return errorResponse(error)
  }
}





