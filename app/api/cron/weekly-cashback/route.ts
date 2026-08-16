import { NextRequest, NextResponse } from 'next/server'
import {
  calculateWeeklyCashback,
  creditWeeklyCashback,
  getEligibleUsersForCashback,
  getPreviousWeekWindow,
} from '@/lib/cashback'
import { createNotification } from '@/lib/notifications'

/**
 * POST /api/cron/weekly-cashback
 *
 * Called every Monday 00:00 UTC (by Vercel Cron or external scheduler).
 * Protected by CRON_SECRET header to prevent public abuse.
 *
 * Vercel cron.json config:
 * { "crons": [{ "path": "/api/cron/weekly-cashback", "schedule": "0 0 * * 1" }] }
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { weekStart, weekEnd } = getPreviousWeekWindow()
  console.log(`[CashbackCron] Processing week: ${weekStart} → ${weekEnd}`)

  const eligibleUsers = await getEligibleUsersForCashback(weekStart, weekEnd)
  console.log(`[CashbackCron] ${eligibleUsers.length} eligible users`)

  const results: Array<{ userId: string; amount: number; bonusId?: string; skipped?: boolean }> = []

  for (const userId of eligibleUsers) {
    const amount = await calculateWeeklyCashback(userId, weekStart, weekEnd)
    if (amount <= 0) {
      results.push({ userId, amount: 0, skipped: true })
      continue
    }

    const bonusId = await creditWeeklyCashback(userId, amount)

    // Send in-app notification
    try {
      await createNotification({
        userId,
        type: 'bonus_received',
        title: 'Cashback hebdomadaire',
        message: `Vous avez reçu ${amount.toFixed(2)} € de cashback cette semaine ! Mise requise : 5× en 72h.`,
        data: { bonusId, amount, expiresInHours: 72 },
      })
    } catch (notifError) {
      console.warn(`[CashbackCron] Notification failed for ${userId}:`, notifError)
    }

    results.push({ userId, amount, bonusId })
  }

  const credited = results.filter(r => !r.skipped)
  console.log(`[CashbackCron] Credited cashback to ${credited.length} users`)

  return NextResponse.json({
    success: true,
    weekStart,
    weekEnd,
    totalUsers: eligibleUsers.length,
    credited: credited.length,
    skipped: results.filter(r => r.skipped).length,
    totalCashbackAmount: credited.reduce((sum, r) => sum + r.amount, 0),
  })
}

// Allow GET for manual testing in dev
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST' }, { status: 405 })
  }
  return POST(request)
}
