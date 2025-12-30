import { query, transaction } from './db'
import { nanoid } from 'nanoid'

export interface WalletBalance {
  balance: number
  bonusBalance: number
  lockedBalance: number
  currency: string
}

export interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  currency: string
  status: string
  description?: string
  referenceId?: string
  referenceType?: string
  metadata?: any
  createdAt: Date
}

/**
 * Get or create wallet for user
 */
export async function getOrCreateWallet(
  userId: string,
  currency: string = 'MAD'
): Promise<WalletBalance> {
  // Check if wallet exists - handle missing bonus_balance column gracefully
  // Try to select with bonus_balance first, fallback if column doesn't exist
  let existing: any
  let bonusBalance = 0
  
  try {
    existing = await query<{
      balance: string
      bonus_balance: string | null
      locked_balance: string
      currency: string
    }>(
      'SELECT balance, bonus_balance, locked_balance, currency FROM wallets WHERE user_id = ?',
      [userId]
    )
    
    if (existing.rows.length > 0 && existing.rows[0].bonus_balance !== null) {
      bonusBalance = parseFloat(existing.rows[0].bonus_balance || '0')
    }
  } catch (error: any) {
    // bonus_balance column doesn't exist, query without it
    if (error.message && error.message.includes('no such column: bonus_balance')) {
      existing = await query<{
        balance: string
        locked_balance: string
        currency: string
      }>(
        'SELECT balance, locked_balance, currency FROM wallets WHERE user_id = ?',
        [userId]
      )
      bonusBalance = 0
    } else {
      throw error
    }
  }

  if (existing.rows.length > 0) {
    return {
      balance: parseFloat(existing.rows[0].balance),
      bonusBalance,
      lockedBalance: parseFloat(existing.rows[0].locked_balance || '0'),
      currency: existing.rows[0].currency,
    }
  }

  // Create new wallet
  // Try with bonus_balance, fallback to without it if column doesn't exist
  try {
    await query(
      `INSERT INTO wallets (id, user_id, currency, balance, bonus_balance, locked_balance)
       VALUES (?, ?, ?, 0, 0, 0)`,
      [nanoid(), userId, currency]
    )
  } catch (error: any) {
    // If bonus_balance column doesn't exist, create without it
    if (error.message && error.message.includes('no such column: bonus_balance')) {
      await query(
        `INSERT INTO wallets (id, user_id, currency, balance, locked_balance)
         VALUES (?, ?, ?, 0, 0)`,
        [nanoid(), userId, currency]
      )
    } else {
      throw error
    }
  }

  return {
    balance: 0,
    bonusBalance: 0,
    lockedBalance: 0,
    currency,
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(
  userId: string
): Promise<WalletBalance> {
  return getOrCreateWallet(userId)
}

/**
 * Create a wallet transaction
 */
export async function createTransaction(data: {
  userId: string
  type: string
  amount: number
  currency?: string
  description?: string
  referenceId?: string
  referenceType?: string
  metadata?: any
}): Promise<Transaction> {
  const currency = data.currency || 'MAD'
  const wallet = await getOrCreateWallet(data.userId, currency)

  const balanceBefore = wallet.balance
  const balanceAfter = balanceBefore + data.amount

  // Update wallet balance
  await query(
    `UPDATE wallets 
     SET balance = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`,
    [balanceAfter, data.userId]
  )

  // Create transaction record
  const transactionId = nanoid()
  await query(
    `INSERT INTO wallet_transactions (
      id, user_id, transaction_type, amount, balance_before, balance_after,
      currency, status, description, reference_id, reference_type, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)`,
    [
      transactionId,
      data.userId,
      data.type,
      data.amount,
      balanceBefore,
      balanceAfter,
      currency,
      data.description || null,
      data.referenceId || null,
      data.referenceType || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  )

  return {
    id: transactionId,
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    balanceBefore,
    balanceAfter,
    currency,
    status: 'completed',
    description: data.description,
    referenceId: data.referenceId,
    referenceType: data.referenceType,
    metadata: data.metadata,
    createdAt: new Date(),
  }
}

/**
 * Lock balance (for active bets)
 */
export async function lockBalance(
  userId: string,
  amount: number
): Promise<boolean> {
  const wallet = await getOrCreateWallet(userId)

  if (wallet.balance < amount) {
    return false
  }

  const newLocked = wallet.lockedBalance + amount
  const newBalance = wallet.balance - amount

  await query(
    `UPDATE wallets 
     SET balance = ?, locked_balance = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`,
    [newBalance, newLocked, userId]
  )

  return true
}

/**
 * Unlock balance (when bet is settled)
 * This restores the balance back to the wallet
 */
export async function unlockBalance(
  userId: string,
  amount: number
): Promise<void> {
  const wallet = await getOrCreateWallet(userId)

  const newLocked = Math.max(0, wallet.lockedBalance - amount)
  const newBalance = wallet.balance + amount // Restore balance when unlocking

  await query(
    `UPDATE wallets 
     SET balance = ?, locked_balance = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`,
    [newBalance, newLocked, userId]
  )
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    type?: string
    status?: string
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<{ transactions: Transaction[]; total: number }> {
  const limit = options.limit || 50
  const offset = options.offset || 0

  let sql = `
    SELECT 
      id, user_id, transaction_type, amount, balance_before, balance_after,
      currency, status, description, reference_id, reference_type, metadata,
      created_at
    FROM wallet_transactions
    WHERE user_id = ?
  `
  const params: any[] = [userId]

  if (options.type) {
    sql += ' AND transaction_type = ?'
    params.push(options.type)
  }

  if (options.status) {
    sql += ' AND status = ?'
    params.push(options.status)
  }

  if (options.startDate) {
    sql += ' AND created_at >= ?'
    params.push(options.startDate.toISOString())
  }

  if (options.endDate) {
    sql += ' AND created_at <= ?'
    params.push(options.endDate.toISOString())
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const transactions = await query<{
    id: string
    user_id: string
    transaction_type: string
    amount: string
    balance_before: string
    balance_after: string
    currency: string
    status: string
    description: string | null
    reference_id: string | null
    reference_type: string | null
    metadata: string | null
    created_at: string
  }>(sql, params)

  // Get total count
  let countSql = 'SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?'
  const countParams: any[] = [userId]

  if (options.type) {
    countSql += ' AND transaction_type = ?'
    countParams.push(options.type)
  }

  if (options.status) {
    countSql += ' AND status = ?'
    countParams.push(options.status)
  }

  if (options.startDate) {
    countSql += ' AND created_at >= ?'
    countParams.push(options.startDate.toISOString())
  }

  if (options.endDate) {
    countSql += ' AND created_at <= ?'
    countParams.push(options.endDate.toISOString())
  }

  const countResult = await query<{ total: number }>(countSql, countParams)
  const total = countResult.rows[0]?.total || 0

  return {
    transactions: transactions.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.transaction_type,
      amount: parseFloat(row.amount),
      balanceBefore: parseFloat(row.balance_before),
      balanceAfter: parseFloat(row.balance_after),
      currency: row.currency,
      status: row.status,
      description: row.description || undefined,
      referenceId: row.reference_id || undefined,
      referenceType: row.reference_type || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at),
    })),
    total: typeof total === 'number' ? total : parseInt(total.toString()),
  }
}

/**
 * Verify balance (reconciliation)
 */
export async function verifyBalance(userId: string): Promise<{
  isValid: boolean
  expectedBalance: number
  actualBalance: number
  difference: number
}> {
  const wallet = await getOrCreateWallet(userId)

  // Calculate expected balance from transactions
  const balanceResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM wallet_transactions 
     WHERE user_id = ? AND status = 'completed'`,
    [userId]
  )

  const expectedBalance = parseFloat(balanceResult.rows[0]?.total || '0')
  const actualBalance = wallet.balance
  const difference = actualBalance - expectedBalance

  return {
    isValid: Math.abs(difference) < 0.01, // Allow small floating point differences
    expectedBalance,
    actualBalance,
    difference,
  }
}

