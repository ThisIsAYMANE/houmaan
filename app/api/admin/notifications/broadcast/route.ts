import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  try {
    const session = await queryOne<{ admin_id: string }>(
      'SELECT admin_id FROM admin_sessions WHERE session_token = ? AND expires_at > datetime("now")',
      [token]
    )
    return session?.admin_id || null
  } catch {
    return null
  }
}

/**
 * POST /api/admin/notifications/broadcast
 * 
 * Broadcast notification to all users
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type = 'system_message' } = body

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Get all active users
    const users = await query('SELECT id FROM users WHERE is_active = 1')

    let sent = 0
    for (const user of users.rows || []) {
      const notificationId = nanoid()
      await query(
        `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, NULL, 0, CURRENT_TIMESTAMP)`,
        [notificationId, user.id, type, title, message]
      )
      sent++
    }

    return NextResponse.json({
      success: true,
      sent
    })
  } catch (error) {
    console.error('Error broadcasting notification:', error)
    return NextResponse.json({ success: false, error: 'Failed to send' }, { status: 500 })
  }
}


