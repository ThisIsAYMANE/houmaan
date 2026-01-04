'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  is_read: number
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const wasUnread = notifications.find(n => n.id === id)?.is_read === 0
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bet_won':
        return '🎉'
      case 'bet_lost':
        return '📉'
      case 'bet_placed':
        return '✅'
      case 'bet_cashout':
        return '💰'
      case 'deposit_confirmed':
        return '✅'
      case 'deposit_pending':
        return '⏳'
      case 'withdrawal_processed':
        return '✅'
      case 'withdrawal_pending':
        return '⏳'
      case 'bonus_received':
        return '🎁'
      case 'tier_upgraded':
        return '⭐'
      case 'admin_alert':
        return '⚠️'
      case 'system_message':
        return '📢'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bet_won':
      case 'deposit_confirmed':
      case 'withdrawal_processed':
      case 'bonus_received':
      case 'tier_upgraded':
        return 'bg-green-500/10 border-green-500/30'
      case 'bet_lost':
        return 'bg-red-500/10 border-red-500/30'
      case 'bet_placed':
      case 'bet_cashout':
        return 'bg-blue-500/10 border-blue-500/30'
      case 'deposit_pending':
      case 'withdrawal_pending':
        return 'bg-yellow-500/10 border-yellow-500/30'
      case 'admin_alert':
        return 'bg-orange-500/10 border-orange-500/30'
      default:
        return 'bg-gray-700 border-gray-600'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
      >
        <Bell className="w-6 h-6 text-text-secondary hover:text-text-primary" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-bg-secondary rounded-lg shadow-2xl border border-border-primary z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border-primary flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-sm text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border-primary">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-bg-tertiary transition-colors ${
                      notification.is_read === 0 ? 'bg-accent-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl border ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-semibold ${notification.is_read === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-text-secondary whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {notification.is_read === 0 && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border-primary">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Could navigate to a full notifications page
                }}
                className="w-full text-center text-sm text-accent-primary hover:text-accent-primary/80"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


