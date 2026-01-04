import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

// Get user from session
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
 * GET /api/notifications
 * 
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let sql = `
      SELECT id, type, title, message, data, is_read, created_at
      FROM notifications
      WHERE user_id = ?
    `
    
    if (unreadOnly) {
      sql += ' AND is_read = 0'
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?'

    const notifications = await query(sql, unreadOnly ? [userId, limit] : [userId, limit])

    // Get unread count
    const unreadCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    )

    return NextResponse.json({
      success: true,
      notifications: notifications.rows || [],
      unreadCount: unreadCount?.count || 0
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * 
 * Create a notification (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, data } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notificationId = nanoid()
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [notificationId, userId, type, title, message, data ? JSON.stringify(data) : null]
    )

    return NextResponse.json({
      success: true,
      notificationId
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}


