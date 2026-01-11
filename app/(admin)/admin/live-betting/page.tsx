'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, Zap, RefreshCw } from 'lucide-react'

interface LiveBet {
  id: string
  user_id: string
  username: string
  amount: number
  odds: number
  potential_win: number
  bet_type: string
  selection_count: number
  risk_score: number
  placed_at: string
}

interface RiskMetrics {
  totalExposure: number
  highRiskBets: number
  largestSingleBet: number
  mostBetOnMatch: {
    matchId: string
    homeTeam: string
    awayTeam: string
    totalStake: number
  } | null
}

export default function LiveBettingMonitor() {
  const router = useRouter()
  const [liveBets, setLiveBets] = useState<LiveBet[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchLiveBets()

    if (autoRefresh) {
      const interval = setInterval(fetchLiveBets, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchLiveBets = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/live-betting', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      if (result.success) {
        setLiveBets(result.data.liveBets || [])
        setRiskMetrics(result.data.riskMetrics)
      }
    } catch (error) {
      console.error('Error fetching live bets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getRiskBadge = (score: number) => {
    if (score >= 80) return 'bg-red-500/20 text-red-500'
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-500'
    return 'bg-green-500/20 text-green-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-500" />
            Live Betting Monitor
          </h1>
          <p className="text-gray-400 mt-2">Real-time betting activity and risk management</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              autoRefresh
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {autoRefresh ? (
              <>
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                Auto-Refresh ON
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Auto-Refresh OFF
              </>
            )}
          </button>
          <button
            onClick={fetchLiveBets}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Risk Metrics */}
      {riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Exposure</span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskMetrics.totalExposure.toLocaleString()} MAD
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">High Risk Bets</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskMetrics.highRiskBets}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Largest Single Bet</span>
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white">
              {riskMetrics.largestSingleBet.toLocaleString()} MAD
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Active Bets</span>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">
              {liveBets.length}
            </div>
          </div>
        </div>
      )}

      {/* Most Bet On Match */}
      {riskMetrics?.mostBetOnMatch && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Hot Match Alert</h3>
          </div>
          <p className="text-gray-300 mb-2">
            <span className="font-semibold">{riskMetrics.mostBetOnMatch.homeTeam}</span>
            {' vs '}
            <span className="font-semibold">{riskMetrics.mostBetOnMatch.awayTeam}</span>
          </p>
          <p className="text-yellow-500 font-semibold">
            Total Stake: {riskMetrics.mostBetOnMatch.totalStake.toLocaleString()} MAD
          </p>
        </div>
      )}

      {/* Live Bets Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Active Bets</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stake
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Odds
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Potential Win
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {liveBets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No active bets at the moment
                  </td>
                </tr>
              ) : (
                liveBets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {bet.username}
                      </div>
                      <div className="text-xs text-gray-400">
                        {bet.user_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                        {bet.bet_type}
                      </span>
                      {bet.selection_count > 1 && (
                        <span className="ml-2 text-xs text-gray-400">
                          ({bet.selection_count} selections)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-white font-semibold">
                      {bet.amount.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-white">
                      {bet.odds.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-green-400">
                      {bet.potential_win.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadge(bet.risk_score)}`}>
                        {bet.risk_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(bet.placed_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Legend */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Risk Score Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div>
              <div className="text-white font-semibold">Low Risk (0-49)</div>
              <div className="text-xs text-gray-400">Normal betting activity</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <div>
              <div className="text-white font-semibold">Medium Risk (50-79)</div>
              <div className="text-xs text-gray-400">Monitor closely</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <div className="text-white font-semibold">High Risk (80-100)</div>
              <div className="text-xs text-gray-400">Requires immediate attention</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



