/**
 * Notification Helper Functions
 * 
 * Create in-app notifications for user events
 */

export type NotificationType = 
  | 'bet_placed' 
  | 'bet_won' 
  | 'bet_lost' 
  | 'bet_cashout'
  | 'deposit_confirmed' 
  | 'deposit_pending'
  | 'withdrawal_processed'
  | 'withdrawal_pending'
  | 'bonus_received'
  | 'tier_upgraded'
  | 'admin_alert'
  | 'system_message'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
}

/**
 * Create a notification
 */
export async function createNotification(data: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    return response.ok
  } catch (error) {
    console.error('Error creating notification:', error)
    return false
  }
}

/**
 * Notification templates
 */

export async function notifyBetPlaced(userId: string, betAmount: number, odds: number) {
  return createNotification({
    userId,
    type: 'bet_placed',
    title: '✅ Bet Placed',
    message: `Your bet of ${betAmount} MAD at odds ${odds.toFixed(2)} has been placed successfully.`,
    data: { amount: betAmount, odds }
  })
}

export async function notifyBetWon(userId: string, betAmount: number, winAmount: number) {
  return createNotification({
    userId,
    type: 'bet_won',
    title: '🎉 Bet Won!',
    message: `Congratulations! Your bet won ${winAmount} MAD (stake: ${betAmount} MAD).`,
    data: { betAmount, winAmount, profit: winAmount - betAmount }
  })
}

export async function notifyBetLost(userId: string, betAmount: number) {
  return createNotification({
    userId,
    type: 'bet_lost',
    title: '📉 Bet Lost',
    message: `Unfortunately, your bet of ${betAmount} MAD was not successful. Better luck next time!`,
    data: { betAmount }
  })
}

export async function notifyCashOut(userId: string, cashOutAmount: number, originalStake: number) {
  return createNotification({
    userId,
    type: 'bet_cashout',
    title: '💰 Cash-Out Successful',
    message: `You cashed out ${cashOutAmount} MAD (original stake: ${originalStake} MAD).`,
    data: { cashOutAmount, originalStake, profit: cashOutAmount - originalStake }
  })
}

export async function notifyDepositConfirmed(userId: string, amount: number, btcAmount?: number) {
  return createNotification({
    userId,
    type: 'deposit_confirmed',
    title: '✅ Deposit Confirmed',
    message: btcAmount 
      ? `Your deposit of ${btcAmount} BTC (${amount} MAD) has been confirmed and added to your wallet.`
      : `Your deposit of ${amount} MAD has been confirmed and added to your wallet.`,
    data: { amount, btcAmount }
  })
}

export async function notifyDepositPending(userId: string, amount: number) {
  return createNotification({
    userId,
    type: 'deposit_pending',
    title: '⏳ Deposit Pending',
    message: `Your deposit of ${amount} MAD is being processed. You'll be notified when it's confirmed.`,
    data: { amount }
  })
}

export async function notifyWithdrawalProcessed(userId: string, amount: number) {
  return createNotification({
    userId,
    type: 'withdrawal_processed',
    title: '✅ Withdrawal Processed',
    message: `Your withdrawal of ${amount} MAD has been processed successfully.`,
    data: { amount }
  })
}

export async function notifyWithdrawalPending(userId: string, amount: number) {
  return createNotification({
    userId,
    type: 'withdrawal_pending',
    title: '⏳ Withdrawal Pending',
    message: `Your withdrawal request of ${amount} MAD is being reviewed. This usually takes 24-48 hours.`,
    data: { amount }
  })
}

export async function notifyBonusReceived(userId: string, amount: number, reason: string) {
  return createNotification({
    userId,
    type: 'bonus_received',
    title: '🎁 Bonus Received!',
    message: `You've received a bonus of ${amount} MAD! ${reason}`,
    data: { amount, reason }
  })
}

export async function notifyTierUpgraded(userId: string, newTier: string, oldTier: string) {
  return createNotification({
    userId,
    type: 'tier_upgraded',
    title: '⭐ Tier Upgraded!',
    message: `Congratulations! You've been upgraded from ${oldTier} to ${newTier} tier. Enjoy your new benefits!`,
    data: { newTier, oldTier }
  })
}

export async function notifyAdminAlert(userId: string, title: string, message: string) {
  return createNotification({
    userId,
    type: 'admin_alert',
    title: `⚠️ ${title}`,
    message,
    data: {}
  })
}

export async function notifySystemMessage(userId: string, title: string, message: string) {
  return createNotification({
    userId,
    type: 'system_message',
    title: `📢 ${title}`,
    message,
    data: {}
  })
}

/**
 * Broadcast notification to all users
 */
export async function broadcastNotification(title: string, message: string) {
  try {
    // This would need a separate endpoint to broadcast to all users
    const response = await fetch('/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    })

    return response.ok
  } catch (error) {
    console.error('Error broadcasting notification:', error)
    return false
  }
}





