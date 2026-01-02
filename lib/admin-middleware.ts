import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, getAdminById } from './admin-auth'
import { UnauthorizedError } from './errors'

export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const sessionToken = authHeader?.replace('Bearer ', '')

  if (!sessionToken) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  const session = await getAdminSession(sessionToken)
  if (!session) {
    return NextResponse.json(
      { error: { message: 'Invalid or expired session', code: 'INVALID_SESSION' } },
      { status: 401 }
    )
  }

  const admin = await getAdminById(session.adminId)
  if (!admin || !admin.is_active) {
    return NextResponse.json(
      { error: { message: 'Admin not found or inactive', code: 'ADMIN_NOT_FOUND' } },
      { status: 401 }
    )
  }

  return { admin, session }
}







