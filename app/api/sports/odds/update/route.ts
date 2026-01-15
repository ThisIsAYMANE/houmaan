import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { broadcastOddsUpdate, broadcastMarketSuspension } from '@/lib/websocket-server'

/**
 * POST /api/sports/odds/update
 * 
 * Update odds and broadcast changes via WebSocket
 * Used by:
 * - Admin panel to manually update odds
 * - Automated sync from sports API
 * - Internal odds management system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { oddsId, newOdds, suspended } = body

    if (!oddsId) {
      return NextResponse.json(
        { error: 'oddsId is required' },
        { status: 400 }
      )
    }

    // Get current odds data
    const currentOdds = await queryOne<{
      id: string
      market_id: string
      selection: string
      odds_value: number
      previous_odds: number | null
      is_active: boolean
    }>(
      'SELECT id, market_id, selection, odds_value, previous_odds, is_active FROM odds WHERE id = ?',
      [oddsId]
    )

    if (!currentOdds) {
      return NextResponse.json(
        { error: 'Odds not found' },
        { status: 404 }
      )
    }

    // Get market and match info
    const market = await queryOne<{
      match_id: string
    }>(
      'SELECT match_id FROM betting_markets WHERE id = ?',
      [currentOdds.market_id]
    )

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    let updated = false

    // Update odds if new value provided
    if (newOdds !== undefined && newOdds !== currentOdds.odds_value) {
      await query(
        `UPDATE odds 
         SET odds_value = ?, 
             previous_odds = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newOdds, currentOdds.odds_value, oddsId]
      )

      // Broadcast odds change
      broadcastOddsUpdate({
        matchId: market.match_id,
        marketId: currentOdds.market_id,
        oddsId: currentOdds.id,
        selection: currentOdds.selection,
        oldOdds: currentOdds.odds_value,
        newOdds: newOdds,
        timestamp: new Date().toISOString()
      })

      updated = true
    }

    // Update suspension status if provided
    if (suspended !== undefined) {
      await query(
        'UPDATE betting_markets SET is_suspended = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [suspended ? 1 : 0, currentOdds.market_id]
      )

      // Broadcast market suspension
      broadcastMarketSuspension({
        matchId: market.match_id,
        marketId: currentOdds.market_id,
        suspended: suspended,
        timestamp: new Date().toISOString()
      })

      updated = true
    }

    return NextResponse.json({
      success: true,
      updated,
      odds: {
        id: oddsId,
        oldValue: currentOdds.odds_value,
        newValue: newOdds || currentOdds.odds_value,
        suspended: suspended !== undefined ? suspended : false
      }
    })
  } catch (error) {
    console.error('Error updating odds:', error)
    return NextResponse.json(
      { error: 'Failed to update odds' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sports/odds/update (Batch update)
 * 
 * Update multiple odds at once
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      )
    }

    const results = []

    for (const update of updates) {
      try {
        // Get current odds
        const currentOdds = await queryOne<{
          id: string
          market_id: string
          selection: string
          odds_value: number
        }>(
          'SELECT id, market_id, selection, odds_value FROM odds WHERE id = ?',
          [update.oddsId]
        )

        if (!currentOdds) {
          results.push({ oddsId: update.oddsId, success: false, error: 'Not found' })
          continue
        }

        // Get market info
        const market = await queryOne<{ match_id: string }>(
          'SELECT match_id FROM betting_markets WHERE id = ?',
          [currentOdds.market_id]
        )

        if (!market) {
          results.push({ oddsId: update.oddsId, success: false, error: 'Market not found' })
          continue
        }

        // Update odds
        await query(
          `UPDATE odds 
           SET odds_value = ?, 
               previous_odds = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [update.newOdds, currentOdds.odds_value, update.oddsId]
        )

        // Broadcast update
        broadcastOddsUpdate({
          matchId: market.match_id,
          marketId: currentOdds.market_id,
          oddsId: currentOdds.id,
          selection: currentOdds.selection,
          oldOdds: currentOdds.odds_value,
          newOdds: update.newOdds,
          timestamp: new Date().toISOString()
        })

        results.push({
          oddsId: update.oddsId,
          success: true,
          oldOdds: currentOdds.odds_value,
          newOdds: update.newOdds
        })
      } catch (err) {
        results.push({
          oddsId: update.oddsId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      total: updates.length,
      updated: successCount,
      failed: updates.length - successCount,
      results
    })
  } catch (error) {
    console.error('Error in batch odds update:', error)
    return NextResponse.json(
      { error: 'Failed to update odds' },
      { status: 500 }
    )
  }
}





