/**
 * Notification Utility Tests
 */
import {
  notifyBetPlaced,
  notifyBetWon,
  notifyBetLost,
  notifyDepositConfirmed,
  createNotification,
} from '@/lib/notifications'

// Mock fetch
global.fetch = jest.fn()

describe('Notification Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const result = await createNotification({
        userId: 'user-123',
        type: 'bet_placed',
        title: 'Test',
        message: 'Test message',
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      const result = await createNotification({
        userId: 'user-123',
        type: 'bet_placed',
        title: 'Test',
        message: 'Test message',
      })

      expect(result).toBe(false)
    })
  })

  describe('notifyBetPlaced', () => {
    it('should send bet placed notification', async () => {
      await notifyBetPlaced('user-123', 100, 2.5)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Bet Placed'),
        })
      )
    })
  })

  describe('notifyBetWon', () => {
    it('should send bet won notification', async () => {
      await notifyBetWon('user-123', 100, 250)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Bet Won'),
        })
      )
    })
  })

  describe('notifyBetLost', () => {
    it('should send bet lost notification', async () => {
      await notifyBetLost('user-123', 100)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Bet Lost'),
        })
      )
    })
  })

  describe('notifyDepositConfirmed', () => {
    it('should send deposit confirmed notification', async () => {
      await notifyDepositConfirmed('user-123', 500)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Deposit Confirmed'),
        })
      )
    })

    it('should include BTC amount when provided', async () => {
      await notifyDepositConfirmed('user-123', 500, 0.01)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('BTC'),
        })
      )
    })
  })
})





