import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

async function getUserId(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null
  
  try {
    const session = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP',
      [sessionCookie.value]
    )
    return session?.user_id || null
  } catch {
    return null
  }
}

/**
 * POST /api/notifications/mark-all-read
 * 
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}



