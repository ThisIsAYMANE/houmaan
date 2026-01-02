import { NextRequest } from 'next/server'
import { getAdminSession, getAdminById } from '@/lib/admin-auth'
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
    const session = await getAdminSession(sessionToken)
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session')
    }

    // Get admin
    const admin = await getAdminById(session.adminId)
    if (!admin || !admin.is_active) {
      throw new UnauthorizedError('Admin not found or inactive')
    }

    return successResponse({
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}







