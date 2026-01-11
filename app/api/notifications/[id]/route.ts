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
 * PATCH /api/notifications/:id
 * 
 * Mark notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const notificationId = params.id

    // Verify ownership
    const notification = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM notifications WHERE id = ?',
      [notificationId]
    )

    if (!notification || notification.user_id !== userId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Mark as read
    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notificationId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications/:id
 * 
 * Delete notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const notificationId = params.id

    // Verify ownership
    const notification = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM notifications WHERE id = ?',
      [notificationId]
    )

    if (!notification || notification.user_id !== userId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Delete
    await query('DELETE FROM notifications WHERE id = ?', [notificationId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}



