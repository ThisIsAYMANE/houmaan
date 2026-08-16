import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { runBonusMigrations } from '@/lib/bonus-db'

try { runBonusMigrations() } catch {}

/**
 * GET /api/admin/settings
 * Returns all platform settings as a key-value object.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const result = await query<{ key: string; value: string; updated_at: string }>(
      `SELECT key, value, updated_at FROM platform_settings ORDER BY key ASC`
    )

    const settings: Record<string, string> = {}
    for (const row of result.rows) {
      settings[row.key] = row.value
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/settings
 * Updates one or more platform settings atomically.
 * Body: { key: string; value: string }[] or { [key: string]: string }
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()

    // Accept both { key: value } object and [{ key, value }] array
    const pairs: Array<{ key: string; value: string }> = Array.isArray(body)
      ? body
      : Object.entries(body).map(([key, value]) => ({ key, value: String(value) }))

    if (pairs.length === 0) {
      return NextResponse.json({ error: 'No settings to update' }, { status: 400 })
    }

    const now = new Date().toISOString()
    for (const { key, value } of pairs) {
      await query(
        `INSERT INTO platform_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, value, now]
      )
    }

    return NextResponse.json({
      success: true,
      updated: pairs.map(p => p.key),
      message: `${pairs.length} paramètre(s) mis à jour.`,
    })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
