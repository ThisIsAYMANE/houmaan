import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'

// Helper function to safely execute queries and return 0 on error
async function safeQuery<T>(
  sql: string,
  defaultValue: T
): Promise<T> {
  try {
    const result = await query<T>(sql)
    if (result.rows.length === 0) {
      return defaultValue
    }
    const row = result.rows[0]
    // Convert SQLite COUNT/SUM results to numbers if they're strings
    if (row && typeof row === 'object') {
      const converted = { ...row }
      for (const key in converted) {
        if (key === 'count' || key === 'total') {
          const value = converted[key]
          if (typeof value === 'string') {
            converted[key] = (Number(value) || 0) as any
          }
        }
      }
      return converted as T
    }
    return row || defaultValue
  } catch (error) {
    console.error('Query error:', sql, error)
    return defaultValue
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get user statistics
    const totalUsers = await safeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM users',
      { count: 0 }
    )
    const activeUsers = await safeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE is_active = 1',
      { count: 0 }
    )
    const newUsersToday = await safeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM users 
       WHERE DATE(created_at) = DATE('now')`,
      { count: 0 }
    )

    // Get game statistics
    const totalGames = await safeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM games',
      { count: 0 }
    )
    const activeGames = await safeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM games WHERE is_active = 1',
      { count: 0 }
    )

    // Get betting statistics
    const totalBets = await safeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_bets',
      { count: 0 }
    )
    const pendingBets = await safeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_bets WHERE status = 'pending'`,
      { count: 0 }
    )
    const totalWagered = await safeQuery<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM user_bets',
      { total: 0 }
    )

    // Get financial statistics
    const totalDeposits = await safeQuery<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = 'completed'`,
      { total: 0 }
    )
    const totalWithdrawals = await safeQuery<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'completed'`,
      { total: 0 }
    )
    const totalBalance = await safeQuery<{ total: number }>(
      'SELECT COALESCE(SUM(balance), 0) as total FROM wallets',
      { total: 0 }
    )

    // Bitcoin deposit statistics
    const bitcoinDeposits = await safeQuery<{ count: number; total: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(btc_amount), 0) as total 
       FROM deposits WHERE btc_amount IS NOT NULL`,
      { count: 0, total: 0 }
    )
    const pendingDeposits = await safeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM deposits WHERE status = 'pending'`,
      { count: 0 }
    )
    const pendingWithdrawals = await safeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'`,
      { count: 0 }
    )

    // Get recent activity
    let recentUsers: Array<{
      id: string
      email: string
      username: string | null
      created_at: string
    }> = []
    try {
      const usersResult = await query<{
        id: string
        email: string
        username: string | null
        created_at: string
      }>(
        `SELECT id, email, username, created_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT 10`
      )
      recentUsers = usersResult.rows
    } catch (error) {
      console.error('Error fetching recent users:', error)
    }

    let recentBets: Array<{
      id: string
      user_id: string
      amount: number
      status: string
      placed_at: string
    }> = []
    try {
      const betsResult = await query<{
        id: string
        user_id: string
        amount: number
        status: string
        placed_at: string
      }>(
        `SELECT id, user_id, amount, status, placed_at 
         FROM user_bets 
         ORDER BY placed_at DESC 
         LIMIT 10`
      )
      recentBets = betsResult.rows
    } catch (error) {
      console.error('Error fetching recent bets:', error)
    }

    // Get recent deposits
    let recentDeposits: Array<{
      id: string
      user_id: string
      amount: number
      btc_amount: number | null
      status: string
      created_at: string
      email: string
    }> = []
    try {
      const depositsResult = await query<{
        id: string
        user_id: string
        amount: number
        btc_amount: number | null
        status: string
        created_at: string
        email: string
      }>(
        `SELECT d.id, d.user_id, d.amount, d.btc_amount, d.status, d.created_at, u.email
         FROM deposits d
         LEFT JOIN users u ON d.user_id = u.id
         ORDER BY d.created_at DESC 
         LIMIT 10`
      )
      recentDeposits = depositsResult.rows
    } catch (error) {
      console.error('Error fetching recent deposits:', error)
    }

    // Get user growth data (last 7 days)
    let userGrowthData: Array<{ name: string; users: number }> = []
    try {
      const growthResult = await query<{ date: string; count: number }>(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM users
         WHERE created_at >= DATE('now', '-7 days')
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`
      )
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      userGrowthData = growthResult.rows.map((row) => {
        const date = new Date(row.date)
        return {
          name: dayNames[date.getDay()],
          users: Number(row.count) || 0,
        }
      })
    } catch (error) {
      console.error('Error fetching user growth:', error)
    }

    // Get revenue and deposits data (last 6 months)
    let revenueData: Array<{ name: string; revenue: number; deposits: number }> = []
    try {
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      const revenueResult = await query<{ month: string; deposits: number; withdrawals: number }>(
        `SELECT 
          strftime('%Y-%m', created_at) as month,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as deposits
         FROM deposits
         WHERE created_at >= DATE('now', '-6 months')
         GROUP BY strftime('%Y-%m', created_at)
         ORDER BY month ASC`
      )
      
      const withdrawalsResult = await query<{ month: string; withdrawals: number }>(
        `SELECT 
          strftime('%Y-%m', created_at) as month,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as withdrawals
         FROM withdrawals
         WHERE created_at >= DATE('now', '-6 months')
         GROUP BY strftime('%Y-%m', created_at)
         ORDER BY month ASC`
      )

      // Merge deposits and withdrawals data
      const revenueMap = new Map<string, { deposits: number; withdrawals: number }>()
      
      revenueResult.rows.forEach(row => {
        revenueMap.set(row.month, { deposits: Number(row.deposits) || 0, withdrawals: 0 })
      })
      
      withdrawalsResult.rows.forEach(row => {
        const existing = revenueMap.get(row.month) || { deposits: 0, withdrawals: 0 }
        existing.withdrawals = Number(row.withdrawals) || 0
        revenueMap.set(row.month, existing)
      })

      revenueData = Array.from(revenueMap.entries()).map(([month, data]) => {
        const [year, monthNum] = month.split('-')
        return {
          name: monthNames[parseInt(monthNum) - 1],
          revenue: data.deposits - data.withdrawals,
          deposits: data.deposits,
        }
      })
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    }

    // Get bet status distribution
    let betStatusData: Array<{ name: string; value: number }> = []
    try {
      const wonBets = await safeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM user_bets WHERE status = 'won'`,
        { count: 0 }
      )
      const lostBets = await safeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM user_bets WHERE status = 'lost'`,
        { count: 0 }
      )
      const pendingBetsData = await safeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM user_bets WHERE status = 'pending'`,
        { count: 0 }
      )
      const cancelledBets = await safeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM user_bets WHERE status = 'cancelled'`,
        { count: 0 }
      )

      betStatusData = [
        { name: 'Gagnés', value: wonBets.count || 0 },
        { name: 'Perdus', value: lostBets.count || 0 },
        { name: 'En attente', value: pendingBetsData.count || 0 },
        { name: 'Annulés', value: cancelledBets.count || 0 },
      ]
    } catch (error) {
      console.error('Error fetching bet status:', error)
    }

    return successResponse({
      users: {
        total: totalUsers.count || 0,
        active: activeUsers.count || 0,
        newToday: newUsersToday.count || 0,
      },
      games: {
        total: totalGames.count || 0,
        active: activeGames.count || 0,
      },
      betting: {
        total: totalBets.count || 0,
        pending: pendingBets.count || 0,
        totalWagered: totalWagered.total || 0,
      },
      financial: {
        totalDeposits: totalDeposits.total || 0,
        totalWithdrawals: totalWithdrawals.total || 0,
        totalBalance: totalBalance.total || 0,
        pendingDeposits: pendingDeposits.count || 0,
        pendingWithdrawals: pendingWithdrawals.count || 0,
      },
      bitcoin: {
        totalDeposits: bitcoinDeposits.count || 0,
        totalBTC: bitcoinDeposits.total || 0,
      },
      recent: {
        users: recentUsers,
        bets: recentBets,
        deposits: recentDeposits,
      },
      charts: {
        userGrowth: userGrowthData,
        revenue: revenueData,
        betStatus: betStatusData,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return errorResponse(error)
  }
}
