import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// Verify admin session
async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

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
 * GET /api/admin/live-betting
 * 
 * Get real-time betting activity and risk metrics
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request)
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recent bets (last 30 minutes)
    const liveBets = await query(
      `SELECT 
        ub.id,
        ub.user_id,
        u.username,
        u.email,
        ub.amount,
        ub.odds,
        ub.potential_win,
        ub.bet_type,
        ub.status,
        ub.created_at as placed_at,
        (SELECT COUNT(*) FROM bet_selections WHERE bet_id = ub.id) as selection_count
      FROM user_bets ub
      INNER JOIN users u ON ub.user_id = u.id
      WHERE ub.status = 'pending'
        AND ub.created_at >= datetime('now', '-30 minutes')
      ORDER BY ub.created_at DESC
      LIMIT 50`
    )

    // Calculate risk metrics
    const totalExposure = await queryOne<{ total: number }>(
      'SELECT COALESCE(SUM(potential_win), 0) as total FROM user_bets WHERE status = "pending"'
    )

    const largestBet = await queryOne<{ amount: number }>(
      'SELECT COALESCE(MAX(amount), 0) as amount FROM user_bets WHERE status = "pending"'
    )

    // Get most bet on match
    const mostBetMatch = await queryOne<{
      match_id: string
      home_team: string
      away_team: string
      total_stake: number
    }>(
      `SELECT 
        bs.match_id,
        m.home_team,
        m.away_team,
        SUM(ub.amount) as total_stake
      FROM bet_selections bs
      INNER JOIN user_bets ub ON bs.bet_id = ub.id
      INNER JOIN matches m ON bs.match_id = m.id
      WHERE ub.status = 'pending'
      GROUP BY bs.match_id, m.home_team, m.away_team
      ORDER BY total_stake DESC
      LIMIT 1`
    )

    // Calculate risk scores for each bet
    const betsWithRisk = (liveBets.rows || []).map((bet: any) => {
      let riskScore = 0

      // High amount = higher risk
      if (bet.amount > 10000) riskScore += 30
      else if (bet.amount > 5000) riskScore += 20
      else if (bet.amount > 1000) riskScore += 10

      // High odds = higher risk
      if (bet.odds > 50) riskScore += 30
      else if (bet.odds > 20) riskScore += 20
      else if (bet.odds > 10) riskScore += 10

      // High potential win = higher risk
      if (bet.potential_win > 50000) riskScore += 30
      else if (bet.potential_win > 20000) riskScore += 20
      else if (bet.potential_win > 10000) riskScore += 10

      // Multiple selections = lower risk (spread)
      if (bet.selection_count > 5) riskScore -= 10
      else if (bet.selection_count > 3) riskScore -= 5

      return {
        ...bet,
        risk_score: Math.max(0, Math.min(100, riskScore))
      }
    })

    const highRiskBets = betsWithRisk.filter((bet: any) => bet.risk_score >= 80).length

    return NextResponse.json({
      success: true,
      data: {
        liveBets: betsWithRisk,
        riskMetrics: {
          totalExposure: totalExposure?.total || 0,
          highRiskBets,
          largestSingleBet: largestBet?.amount || 0,
          mostBetOnMatch: mostBetMatch ? {
            matchId: mostBetMatch.match_id,
            homeTeam: mostBetMatch.home_team,
            awayTeam: mostBetMatch.away_team,
            totalStake: mostBetMatch.total_stake
          } : null
        }
      }
    })
  } catch (error) {
    console.error('Error fetching live betting data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}





