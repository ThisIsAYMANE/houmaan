'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, TrendingUp, Users, DollarSign, Trophy, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface GamePerformance {
  id: string
  title: string
  provider_name: string
  sessions: number
  total_wagered: number
  total_won: number
  revenue: number
  rtp: number
  unique_players: number
}

interface CasinoStats {
  totalSessions: number
  totalWagered: number
  totalWon: number
  netRevenue: number
  avgSessionDuration: number
  topGames: GamePerformance[]
  revenueByProvider: Array<{ name: string; revenue: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function CasinoAnalyticsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<CasinoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch(`/api/admin/casino-analytics?range=${timeRange}`, {
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
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching casino analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            Casino Analytics
          </h1>
          <p className="text-gray-400 mt-2">Game performance and player activity</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Sessions</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalSessions.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Wagered</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalWagered.toLocaleString()} MAD
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Won</span>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalWon.toLocaleString()} MAD
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Net Revenue</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            +{stats.netRevenue.toLocaleString()} MAD
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Session</span>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.avgSessionDuration} min
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Provider */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Revenue by Provider</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.revenueByProvider}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.revenue.toLocaleString()}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {stats.revenueByProvider.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Games by Revenue */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Top Games by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topGames.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="title" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="revenue" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Games Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Top Performing Games</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Game</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Provider</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Sessions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Players</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Wagered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Won</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">RTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stats.topGames.map((game, index) => (
                <tr key={game.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold">#{index + 1}</span>
                      <span className="text-white font-medium">{game.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{game.provider_name}</td>
                  <td className="px-6 py-4 text-right text-white">{game.sessions.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-white">{game.unique_players}</td>
                  <td className="px-6 py-4 text-right text-white">{game.total_wagered.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-white">{game.total_won.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-green-400 font-semibold">
                    +{game.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${game.rtp > 97 ? 'text-red-400' : game.rtp > 95 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {game.rtp.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

