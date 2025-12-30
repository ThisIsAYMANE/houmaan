import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'

// Get session from cookie (simplified - in production use proper auth)
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      matchId,
      gameId,
      betType, // 'single', 'accumulator', 'system'
      marketType,
      selection,
      odds,
      amount,
      currency = 'MAD'
    } = body

    if (!betType || !selection || !odds || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate potential win
    const potentialWin = amount * odds

    // Create bet record
    const betId = nanoid()
    await query(
      `INSERT INTO user_bets (
        id, user_id, game_id, match_id, bet_type, market_type, 
        selection, odds, amount, potential_win, status, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        betId,
        userId,
        gameId || null,
        matchId || null,
        betType,
        marketType || null,
        selection,
        odds,
        amount,
        potentialWin,
        currency
      ]
    )

    // In production, you would also:
    // - Deduct amount from user wallet
    // - Validate odds haven't changed
    // - Handle accumulator/system bets differently

    return NextResponse.json({
      betId,
      message: 'Bet placed successfully',
      status: 'pending'
    })
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let sql = `
      SELECT 
        b.id,
        b.user_id,
        b.game_id,
        b.match_id,
        b.bet_type,
        b.market_type,
        b.selection,
        b.odds,
        b.amount,
        b.potential_win,
        b.status,
        b.result,
        b.payout,
        b.currency,
        b.placed_at,
        b.settled_at,
        m.home_team,
        m.away_team,
        m.current_score as match_score
      FROM user_bets b
      LEFT JOIN matches m ON b.match_id = m.id
      WHERE b.user_id = ?
    `

    const params: unknown[] = [userId]

    if (status) {
      sql += ' AND b.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY b.placed_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const result = await query(sql, params)

    return NextResponse.json({
      bets: result.rows,
      total: result.rowCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    )
  }
}




