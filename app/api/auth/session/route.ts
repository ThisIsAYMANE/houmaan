import { NextRequest } from 'next/server'
import { getSession, getUserById } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      throw new UnauthorizedError('No session token provided')
    }

    // Get session
    const session = await getSession(sessionToken)
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session')
    }

    // Get user
    const user = await getUserById(session.userId)
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive')
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        vipLevel: user.vip_level,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}












