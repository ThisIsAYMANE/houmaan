'use client'

import { useState, useEffect } from 'react'
import { Bell, Trash2, CheckCheck, Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  is_read: number
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const url = filter === 'unread' ? '/api/notifications?unread=true' : '/api/notifications'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
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
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bet_won': return '🎉'
      case 'bet_lost': return '📉'
      case 'bet_placed': return '✅'
      case 'bet_cashout': return '💰'
      case 'deposit_confirmed': return '✅'
      case 'deposit_pending': return '⏳'
      case 'withdrawal_processed': return '✅'
      case 'withdrawal_pending': return '⏳'
      case 'bonus_received': return '🎁'
      case 'tier_upgraded': return '⭐'
      case 'admin_alert': return '⚠️'
      case 'system_message': return '📢'
      default: return '🔔'
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

  const unreadCount = notifications.filter(n => n.is_read === 0).length

  return (
    <div className="min-h-screen bg-bg-primary pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-accent-primary" />
            Notifications
          </h1>
          <p className="text-text-secondary">Stay updated on your account activity</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-bg-secondary rounded-lg p-4 mb-6 flex items-center justify-between border border-border-primary">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary/80 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <Link
              href="/settings/notifications"
              className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary/80 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-bg-secondary rounded-lg p-12 text-center border border-border-primary">
            <Bell className="w-16 h-16 mx-auto mb-4 text-text-secondary opacity-50" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No notifications</h3>
            <p className="text-text-secondary">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-bg-secondary rounded-lg p-6 border transition-colors ${
                  notification.is_read === 0
                    ? 'border-accent-primary/50 bg-accent-primary/5'
                    : 'border-border-primary'
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl border ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`text-lg font-semibold ${notification.is_read === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-sm text-text-secondary whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-text-secondary mb-4">
                      {notification.message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {notification.is_read === 0 && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-accent-primary hover:text-accent-primary/80 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
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
    </div>
  )
}




