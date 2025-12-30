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
            converted[key] = Number(value) || 0
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
      },
      recent: {
        users: recentUsers,
        bets: recentBets,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return errorResponse(error)
  }
}


