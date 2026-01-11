import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const bets = await query<{
      id: string
      user_id: string
      amount: number
      status: string
      placed_at: string
      odds: number
      selection: string
    }>(
      `SELECT id, user_id, amount, status, placed_at, odds, selection 
       FROM user_bets 
       ORDER BY placed_at DESC 
       LIMIT 100`
    )

    return successResponse(bets.rows)
  } catch (error) {
    console.error('Admin bets error:', error)
    return errorResponse(error)
  }
}








