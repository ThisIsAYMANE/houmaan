'use client'

import { useState } from 'react'
import { Send, Bell, Users } from 'lucide-react'

export default function AdminNotificationsPage() {
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'system_message',
    target: 'all' // all, specific user, tier
  })

  const sendNotification = async () => {
    if (!form.title || !form.message) {
      alert('Please fill in all fields')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_session_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          type: form.type
        })
      })

      if (response.ok) {
        alert('✅ Notification sent successfully!')
        setForm({ title: '', message: '', type: 'system_message', target: 'all' })
      } else {
        alert('❌ Failed to send notification')
      }
    } catch (error) {
      alert('❌ Error sending notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-500" />
          Send Notifications
        </h1>
        <p className="text-gray-400 mt-2">Broadcast messages to users</p>
      </div>

      {/* Send Notification Form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          New Notification
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter notification title"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Enter notification message"
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system_message">📢 System Message</option>
              <option value="admin_alert">⚠️ Admin Alert</option>
              <option value="bonus_received">🎁 Bonus</option>
            </select>
          </div>

          {/* Target (Future feature) */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Send To
            </label>
            <select
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="bronze" disabled>Bronze Tier (Coming Soon)</option>
              <option value="silver" disabled>Silver Tier (Coming Soon)</option>
              <option value="gold" disabled>Gold Tier (Coming Soon)</option>
              <option value="platinum" disabled>Platinum Tier (Coming Soon)</option>
            </select>
          </div>

          {/* Send Button */}
          <button
            onClick={sendNotification}
            disabled={sending}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats (Future feature) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Sent</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white">Coming Soon</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Read Rate</span>
            <Bell className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">Coming Soon</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Users</span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-white">Coming Soon</div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/30">
        <h3 className="text-lg font-bold text-blue-400 mb-2">📢 Notification Guidelines</h3>
        <ul className="text-gray-300 text-sm space-y-2">
          <li>• Keep messages clear and concise</li>
          <li>• Use appropriate notification types for context</li>
          <li>• Avoid sending too many notifications (prevents notification fatigue)</li>
          <li>• Test with a small group before broadcasting to all users</li>
          <li>• Notifications are delivered instantly to online users</li>
        </ul>
      </div>
    </div>
  )
}




