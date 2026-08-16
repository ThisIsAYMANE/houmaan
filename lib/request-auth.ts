/**
 * Shared helper for extracting the session token from API requests.
 * Tries multiple sources:
 *   1) Authorization: Bearer {token}
 *   2) X-Session-Token header
 *   3) session_token cookie
 */

import { NextRequest } from 'next/server'
import { getSession, getUserById } from '@/lib/auth'

export async function getRequestUser(request: NextRequest) {
  // 1) Authorization: Bearer {token}
  const authHeader = request.headers.get('authorization')
  let sessionToken = authHeader?.replace('Bearer ', '') || null

  // 2) Fallback: X-Session-Token header
  if (!sessionToken) {
    sessionToken = request.headers.get('x-session-token')
  }

  // 3) Fallback: cookie
  if (!sessionToken) {
    sessionToken = request.cookies.get('session_token')?.value || null
  }

  if (!sessionToken) return null

  const session = await getSession(sessionToken)
  if (!session) return null

  const user = await getUserById(session.userId)
  if (!user || !user.is_active) return null

  return user
}
