'use client'

import { useState, useEffect } from 'react'
import { Bell, Save } from 'lucide-react'
import Link from 'next/link'

interface NotificationPreferences {
  bet_placed: boolean
  bet_won: boolean
  bet_lost: boolean
  bet_cashout: boolean
  deposit_confirmed: boolean
  deposit_pending: boolean
  withdrawal_processed: boolean
  withdrawal_pending: boolean
  bonus_received: boolean
  tier_upgraded: boolean
  admin_alert: boolean
  system_message: boolean
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    bet_placed: true,
    bet_won: true,
    bet_lost: true,
    bet_cashout: true,
    deposit_confirmed: true,
    deposit_pending: true,
    withdrawal_processed: true,
    withdrawal_pending: true,
    bonus_received: true,
    tier_upgraded: true,
    admin_alert: true,
    system_message: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/notification-preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.preferences) {
          // Convert 0/1 to boolean
          const prefs: any = {}
          Object.keys(data.preferences).forEach(key => {
            if (key !== 'user_id' && key !== 'created_at' && key !== 'updated_at') {
              prefs[key] = data.preferences[key] === 1
            }
          })
          setPreferences(prefs)
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        alert('✅ Preferences saved successfully!')
      } else {
        alert('❌ Failed to save preferences')
      }
    } catch (error) {
      alert('❌ Error saving preferences')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const notificationTypes = [
    {
      category: '🎯 Betting',
      items: [
        { key: 'bet_placed', label: 'Bet Placed', description: 'When you place a new bet' },
        { key: 'bet_won', label: 'Bet Won', description: 'When your bet wins' },
        { key: 'bet_lost', label: 'Bet Lost', description: 'When your bet loses' },
        { key: 'bet_cashout', label: 'Cash-Out', description: 'When you cash-out a bet' }
      ]
    },
    {
      category: '💰 Wallet',
      items: [
        { key: 'deposit_confirmed', label: 'Deposit Confirmed', description: 'When your deposit is confirmed' },
        { key: 'deposit_pending', label: 'Deposit Pending', description: 'When your deposit is being processed' },
        { key: 'withdrawal_processed', label: 'Withdrawal Processed', description: 'When your withdrawal is processed' },
        { key: 'withdrawal_pending', label: 'Withdrawal Pending', description: 'When your withdrawal is being reviewed' }
      ]
    },
    {
      category: '⭐ Rewards & Account',
      items: [
        { key: 'bonus_received', label: 'Bonus Received', description: 'When you receive a bonus' },
        { key: 'tier_upgraded', label: 'Tier Upgraded', description: 'When your VIP tier is upgraded' }
      ]
    },
    {
      category: '📢 System',
      items: [
        { key: 'admin_alert', label: 'Admin Alerts', description: 'Important notices from administrators' },
        { key: 'system_message', label: 'System Messages', description: 'Platform updates and announcements' }
      ]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/notifications" className="text-accent-primary hover:underline mb-2 inline-block">
            ← Back to Notifications
          </Link>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-accent-primary" />
            Notification Preferences
          </h1>
          <p className="text-text-secondary">
            Choose which notifications you want to receive
          </p>
        </div>

        {/* Preferences */}
        <div className="space-y-6 mb-6">
          {notificationTypes.map((category) => (
            <div key={category.category} className="bg-bg-secondary rounded-lg p-6 border border-border-primary">
              <h2 className="text-xl font-bold text-text-primary mb-4">{category.category}</h2>
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-lg bg-bg-tertiary border border-border-primary hover:border-accent-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">{item.label}</div>
                      <div className="text-sm text-text-secondary">{item.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={preferences[item.key as keyof NotificationPreferences]}
                        onChange={() => togglePreference(item.key as keyof NotificationPreferences)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Preferences
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 rounded-lg p-6 border border-blue-500/30">
          <h3 className="text-lg font-bold text-blue-400 mb-2">ℹ️ About Notifications</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Notifications appear in the notification bell at the top of the page</li>
            <li>• Changes to preferences are applied immediately</li>
            <li>• Critical security alerts will always be delivered regardless of preferences</li>
            <li>• Currently, only in-app notifications are available (email/SMS coming soon)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

