import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id

    // Get match info
    const match = await query(
      `SELECT id, status, is_live FROM matches WHERE id = ?`,
      [matchId]
    )

    if (match.rows.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Get betting markets and odds
    const sql = `
      SELECT 
        bm.id as market_id,
        bm.name as market_name,
        bm.slug as market_slug,
        bm.type as market_type,
        o.id as odds_id,
        o.selection,
        o.odds_value,
        o.previous_odds,
        o.is_active
      FROM betting_markets bm
      LEFT JOIN odds o ON bm.id = o.market_id AND o.is_active = 1
      WHERE bm.match_id = ? AND bm.is_active = 1
      ORDER BY bm.type, o.selection
    `

    const result = await query(sql, [matchId])

    // Group odds by market
    const marketsMap = new Map()
    
    for (const row of result.rows) {
      const marketId = row.market_id
      if (!marketsMap.has(marketId)) {
        marketsMap.set(marketId, {
          id: row.market_id,
          name: row.market_name,
          slug: row.market_slug,
          type: row.market_type,
          odds: []
        })
      }

      if (row.odds_id) {
        marketsMap.get(marketId).odds.push({
          id: row.odds_id,
          selection: row.selection,
          odds: row.odds_value,
          previousOdds: row.previous_odds,
          change: row.previous_odds 
            ? (row.odds_value > row.previous_odds ? 'up' : row.odds_value < row.previous_odds ? 'down' : 'same')
            : null
        })
      }
    }

    const markets = Array.from(marketsMap.values())

    return NextResponse.json({
      matchId,
      markets
    })
  } catch (error) {
    console.error('Error fetching odds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch odds' },
      { status: 500 }
    )
  }
}




