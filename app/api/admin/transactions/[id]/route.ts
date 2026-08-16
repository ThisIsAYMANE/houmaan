import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'

/**
 * PATCH /api/admin/transactions/[id]
 * Updates a transaction status. For 'completed' deposits: credits wallet balance.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { status, reason } = await request.json()
    if (!['completed', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: completed, rejected, pending' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Update deposit status
    const depositResult = await query(
      `UPDATE deposits SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, params.id]
    )

    if (depositResult.rowCount === 0) {
      // Try withdrawals table
      await query(
        `UPDATE withdrawals SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, params.id]
      )
    }

    // If completing a deposit, credit the user's wallet
    if (status === 'completed') {
      const deposit = await query<{ user_id: string; amount: number }>(
        `SELECT user_id, amount FROM deposits WHERE id = ?`,
        [params.id]
      )
      if (deposit.rows.length > 0) {
        const { user_id, amount } = deposit.rows[0]
        await query(
          `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
          [amount, user_id]
        )
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: params.id,
      status,
      reason: reason ?? null,
    })
  } catch (error: any) {
    console.error('Transaction PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
