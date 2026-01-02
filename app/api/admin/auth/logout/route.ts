import { NextRequest } from 'next/server'
import { deleteAdminSession } from '@/lib/admin-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      throw new UnauthorizedError('No session token provided')
    }

    await deleteAdminSession(sessionToken)

    return successResponse({ message: 'Logged out successfully' })
  } catch (error) {
    return errorResponse(error)
  }
}







