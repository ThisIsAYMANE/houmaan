'use client'

import { useState } from 'react'
import { Download, FileText, Calendar, TrendingUp, Users, DollarSign, Gamepad2 } from 'lucide-react'
import { exportBettingReport, exportCasinoReport, exportTransactionsReport, exportUsersReport } from '@/lib/export-utils'

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const generateReport = async (type: string) => {
    setGenerating(true)
    try {
      const token = localStorage.getItem('admin_session_token')
      const params = new URLSearchParams()
      if (dateRange.start) params.append('from', dateRange.start)
      if (dateRange.end) params.append('to', dateRange.end)

      const response = await fetch(`/api/admin/reports/${type}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success && data.data) {
        switch (type) {
          case 'betting':
            exportBettingReport(data.data)
            break
          case 'casino':
            exportCasinoReport(data.data)
            break
          case 'transactions':
            exportTransactionsReport(data.data)
            break
          case 'users':
            exportUsersReport(data.data)
            break
        }
        alert('✅ Report generated successfully!')
      } else {
        alert('❌ No data found for the selected period')
      }
    } catch (error) {
      alert('❌ Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reports & Export</h1>
        <p className="text-gray-400 mt-2">Generate and download detailed reports</p>
      </div>

      {/* Date Range */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Date Range Filter</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <h3 className="text-lg font-semibold text-white">Betting Report</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">All bets with details, odds, and outcomes</p>
          <button 
            onClick={() => generateReport('betting')}
            disabled={generating}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Generate CSV
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Casino Report</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Game performance, RTP, and revenue analysis</p>
          <button 
            onClick={() => generateReport('casino')}
            disabled={generating}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Generate CSV
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Financial Report</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">All transactions: deposits, withdrawals, bets</p>
          <button 
            onClick={() => generateReport('transactions')}
            disabled={generating}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Generate CSV
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Users Report</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">User statistics, tiers, and activity</p>
          <button 
            onClick={() => generateReport('users')}
            disabled={generating}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Generate CSV
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/30">
        <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Export Information
        </h3>
        <ul className="text-gray-300 text-sm space-y-2">
          <li>• Reports are generated in CSV format for easy Excel/Google Sheets import</li>
          <li>• Use date range filter to limit report scope (leave empty for all data)</li>
          <li>• Large reports may take a few moments to generate</li>
          <li>• All amounts are in MAD currency</li>
          <li>• Dates are formatted in FR locale</li>
        </ul>
      </div>
    </div>
  )
}
