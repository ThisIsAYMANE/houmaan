/**
 * NotificationBell Component Tests
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import NotificationBell from '@/components/layout/NotificationBell'

// Mock fetch
global.fetch = jest.fn()

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        notifications: [],
        unreadCount: 0,
      }),
    })
  })

  it('should render notification bell', () => {
    render(<NotificationBell />)
    
    const bellButton = screen.getByRole('button')
    expect(bellButton).toBeInTheDocument()
  })

  it('should show unread count badge', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        notifications: [
          {
            id: 'notif-1',
            type: 'bet_placed',
            title: 'Bet Placed',
            message: 'Your bet was placed',
            is_read: 0,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      }),
    })

    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('should open dropdown when clicked', async () => {
    render(<NotificationBell />)

    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })
  })

  it('should display notifications in dropdown', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        notifications: [
          {
            id: 'notif-1',
            type: 'bet_placed',
            title: '✅ Bet Placed',
            message: 'Your bet was placed',
            is_read: 0,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      }),
    })

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('✅ Bet Placed')).toBeInTheDocument()
      expect(screen.getByText('Your bet was placed')).toBeInTheDocument()
    })
  })

  it('should mark notification as read', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          notifications: [
            {
              id: 'notif-1',
              type: 'bet_placed',
              title: '✅ Bet Placed',
              message: 'Your bet was placed',
              is_read: 0,
              created_at: new Date().toISOString(),
            },
          ],
          unreadCount: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('Mark as read')).toBeInTheDocument()
    })

    const markAsReadButton = screen.getByText('Mark as read')
    fireEvent.click(markAsReadButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/notif-1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('should close dropdown when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <NotificationBell />
      </div>
    )

    const bellButton = screen.getByRole('button')
    fireEvent.click(bellButton)

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
    })

    const outside = screen.getByTestId('outside')
    fireEvent.mouseDown(outside)

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })
})





