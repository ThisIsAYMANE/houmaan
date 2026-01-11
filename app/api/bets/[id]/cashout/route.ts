import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { calculateCashOut, processCashOut } from '@/lib/cashout'

// Get session from cookie
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
 * GET /api/bets/:id/cashout
 * 
 * Calculate cash-out value for a bet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const betId = params.id

    // Verify bet ownership
    const bet = await queryOne<{ user_id: string, status: string }>(
      'SELECT user_id, status FROM user_bets WHERE id = ?',
      [betId]
    )

    if (!bet) {
      return NextResponse.json(
        { error: 'Bet not found' },
        { status: 404 }
      )
    }

    if (bet.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Calculate cash-out
    const calculation = await calculateCashOut(betId)

    return NextResponse.json({
      betId,
      ...calculation
    })
  } catch (error) {
    console.error('Error calculating cash-out:', error)
    return NextResponse.json(
      { error: 'Failed to calculate cash-out' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bets/:id/cashout
 * 
 * Process cash-out for a bet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const betId = params.id
    const body = await request.json()
    const { partial = false, percentage = 100 } = body

    // Validate percentage
    if (partial && (percentage <= 0 || percentage > 100)) {
      return NextResponse.json(
        { error: 'Percentage must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Process cash-out
    const result = await processCashOut(betId, userId, partial, percentage)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Cash-out failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      betId,
      cashOutAmount: result.cashOutAmount,
      remainingStake: result.remainingStake,
      partial,
      percentage: partial ? percentage : 100,
      message: partial 
        ? `Partial cash-out (${percentage}%) successful`
        : 'Cash-out successful'
    })
  } catch (error) {
    console.error('Error processing cash-out:', error)
    return NextResponse.json(
      { error: 'Failed to process cash-out' },
      { status: 500 }
    )
  }
}



