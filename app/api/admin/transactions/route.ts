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

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'deposit', 'withdrawal', 'bet', 'win', 'all'
    const status = searchParams.get('status') // 'pending', 'completed', 'failed', 'all'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search') // user email/username
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build WHERE conditions
    let conditions: string[] = []
    let params: any[] = []

    // Filter by transaction type
    if (type && type !== 'all') {
      conditions.push('type = ?')
      params.push(type)
    }

    // Filter by status
    if (status && status !== 'all') {
      conditions.push('status = ?')
      params.push(status)
    }

    // Filter by date range
    if (dateFrom) {
      conditions.push('created_at >= ?')
      params.push(dateFrom)
    }
    if (dateTo) {
      conditions.push('created_at <= ?')
      params.push(dateTo + ' 23:59:59')
    }

    // Build query for wallet transactions
    let whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    
    // Get transactions from deposits, withdrawals, and wallet_transactions
    const transactionsQuery = `
      SELECT 
        d.id,
        d.user_id,
        d.amount,
        d.currency,
        d.btc_amount,
        d.address,
        d.tx_hash,
        d.status,
        d.network,
        d.created_at,
        'deposit' as type,
        u.email,
        u.username
      FROM deposits d
      LEFT JOIN users u ON d.user_id = u.id
      ${type && type !== 'all' && type !== 'deposit' ? 'WHERE 1=0' : ''}
      ${type === 'deposit' || !type || type === 'all' ? (status && status !== 'all' ? 'WHERE d.status = ?' : '') : ''}
      
      UNION ALL
      
      SELECT 
        w.id,
        w.user_id,
        w.amount,
        w.currency,
        w.btc_amount,
        w.address,
        w.tx_hash,
        w.status,
        w.network,
        w.created_at,
        'withdrawal' as type,
        u.email,
        u.username
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${type && type !== 'all' && type !== 'withdrawal' ? 'WHERE 1=0' : ''}
      ${type === 'withdrawal' || !type || type === 'all' ? (status && status !== 'all' ? 'WHERE w.status = ?' : '') : ''}
      
      UNION ALL
      
      SELECT 
        wt.id,
        wt.user_id,
        wt.amount,
        wt.currency,
        NULL as btc_amount,
        NULL as address,
        NULL as tx_hash,
        'completed' as status,
        NULL as network,
        wt.created_at,
        wt.type,
        u.email,
        u.username
      FROM wallet_transactions wt
      LEFT JOIN users u ON wt.user_id = u.id
      WHERE wt.type IN ('bet', 'win', 'loss')
      ${type && type !== 'all' && !['bet', 'win', 'loss'].includes(type) ? 'AND 1=0' : ''}
      ${type && type !== 'all' && ['bet', 'win', 'loss'].includes(type) ? 'AND wt.type = ?' : ''}
      
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `

    // Build params array based on filters
    let queryParams: any[] = []
    
    // Deposit status filter
    if ((type === 'deposit' || !type || type === 'all') && status && status !== 'all') {
      queryParams.push(status)
    }
    
    // Withdrawal status filter
    if ((type === 'withdrawal' || !type || type === 'all') && status && status !== 'all') {
      queryParams.push(status)
    }
    
    // Wallet transaction type filter
    if (type && type !== 'all' && ['bet', 'win', 'loss'].includes(type)) {
      queryParams.push(type)
    }
    
    // Pagination
    queryParams.push(limit, offset)

    const result = await query<any>(transactionsQuery, queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count FROM (
        SELECT d.id FROM deposits d 
        ${type && type !== 'all' && type !== 'deposit' ? 'WHERE 1=0' : ''}
        ${type === 'deposit' || !type || type === 'all' ? (status && status !== 'all' ? 'WHERE d.status = ?' : '') : ''}
        
        UNION ALL
        
        SELECT w.id FROM withdrawals w
        ${type && type !== 'all' && type !== 'withdrawal' ? 'WHERE 1=0' : ''}
        ${type === 'withdrawal' || !type || type === 'all' ? (status && status !== 'all' ? 'WHERE w.status = ?' : '') : ''}
        
        UNION ALL
        
        SELECT wt.id FROM wallet_transactions wt
        WHERE wt.type IN ('bet', 'win', 'loss')
        ${type && type !== 'all' && !['bet', 'win', 'loss'].includes(type) ? 'AND 1=0' : ''}
        ${type && type !== 'all' && ['bet', 'win', 'loss'].includes(type) ? 'AND wt.type = ?' : ''}
      ) as all_transactions
    `

    let countParams: any[] = []
    if ((type === 'deposit' || !type || type === 'all') && status && status !== 'all') {
      countParams.push(status)
    }
    if ((type === 'withdrawal' || !type || type === 'all') && status && status !== 'all') {
      countParams.push(status)
    }
    if (type && type !== 'all' && ['bet', 'win', 'loss'].includes(type)) {
      countParams.push(type)
    }

    const countResult = await query<{ count: number }>(countQuery, countParams)
    const total = countResult.rows[0]?.count || 0

    return successResponse({
      transactions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin transactions error:', error)
    return errorResponse(error)
  }
}



