'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Gamepad2, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Bitcoin,
  Activity,
  RefreshCw,
  BarChart2
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface DashboardStats {
  users: {
    total: number
    active: number
    newToday: number
  }
  games: {
    total: number
    active: number
  }
  betting: {
    total: number
    pending: number
    totalWagered: number
  }
  financial: {
    totalDeposits: number
    totalWithdrawals: number
    totalBalance: number
    pendingDeposits: number
    pendingWithdrawals: number
  }
  bitcoin: {
    totalDeposits: number
    totalBTC: number
  }
  recent: {
    users: Array<{
      id: string
      email: string
      username: string | null
      created_at: string
    }>
    bets: Array<{
      id: string
      user_id: string
      amount: number
      status: string
      placed_at: string
    }>
    deposits: Array<{
      id: string
      user_id: string
      amount: number
      btc_amount: number | null
      status: string
      created_at: string
      email: string
    }>
  }
  charts: {
    userGrowth: Array<{ name: string; users: number }>
    revenue: Array<{ name: string; revenue: number; deposits: number }>
    betStatus: Array<{ name: string; value: number }>
  }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchStats()

    // Issue Dashboard (Phase 2B): Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStats(), 30_000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      })

      if (response.status === 401) {
        localStorage.removeItem('admin_session_token')
        localStorage.removeItem('admin_user')
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      if (result.success) {
        setStats(result.data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use real data from API instead of mock data
  const userGrowthData = stats?.charts.userGrowth || []
  const revenueData = stats?.charts.revenue || []
  const betStatusData = stats?.charts.betStatus || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Vue d'ensemble · {lastRefresh ? `Mise à jour ${lastRefresh.toLocaleTimeString('fr-FR')}` : 'Chargement...'}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchStats() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Utilisateurs totaux</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.users.total}</p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-sm flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  {stats.users.active} actifs
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Bitcoin Deposits Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Dépôts Bitcoin</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.bitcoin.totalDeposits}</p>
              <div className="flex items-center mt-2">
                <span className="text-orange-400 text-sm flex items-center">
                  <Bitcoin className="w-4 h-4 mr-1" />
                  {(stats.bitcoin.totalBTC ?? 0).toFixed(6)} BTC
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Bitcoin className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Betting Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Paris totaux</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.betting.total}</p>
              <div className="flex items-center mt-2">
                <span className="text-yellow-500 text-sm">
                  {stats.betting.pending} en attente
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Financial Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Solde total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.financial.totalBalance.toLocaleString('fr-FR', {
                  style: 'currency', currency: 'EUR', minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  {stats.financial.pendingDeposits} dép. en attente
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* GGR Card — Phase 2B new */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">GGR (Revenu brut)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {(stats.financial.totalDeposits - stats.financial.totalWithdrawals).toLocaleString('fr-FR', {
                  style: 'currency', currency: 'EUR', minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-purple-400 text-sm">
                  {stats.financial.totalDeposits > 0
                    ? ((1 - stats.financial.totalWithdrawals / stats.financial.totalDeposits) * 100).toFixed(1)
                    : '0.0'}% house edge
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Croissance des utilisateurs</h2>
          {userGrowthData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">Aucune donnée pour cette période</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenus et dépôts</h2>
          {revenueData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">Aucune donnée pour cette période</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenus" />
                <Bar dataKey="deposits" fill="#3b82f6" name="Dépôts" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bet Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Statut des paris</h2>
          {betStatusData.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">Aucun pari enregistré</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={betStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {betStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Wagered summary card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Montant total misé</h2>
          <div className="text-center py-12">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {stats?.betting.totalWagered.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              })}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Montant total des paris</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Paris actifs</p>
                <p className="text-2xl font-bold text-yellow-500">{stats?.betting.pending || 0}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Paris totaux</p>
                <p className="text-2xl font-bold text-green-500">{stats?.betting.total || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Utilisateurs récents</h2>
          <div className="space-y-3">
            {stats.recent.users.length > 0 ? (
              stats.recent.users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Nouveau
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">Aucun utilisateur récent</p>
            )}
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Dépôts récents</h2>
          <div className="space-y-3">
            {stats.recent.deposits.length > 0 ? (
              stats.recent.deposits.slice(0, 5).map((deposit) => (
                <div
                  key={deposit.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">
                      {deposit.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                    {deposit.btc_amount && (
                      <p className="text-orange-400 text-xs flex items-center gap-1">
                        <Bitcoin className="w-3 h-3" />
                        {deposit.btc_amount.toFixed(6)} BTC
                      </p>
                    )}
                    <p className="text-gray-400 text-sm">{deposit.email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      deposit.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : deposit.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {deposit.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">Aucun dépôt récent</p>
            )}
          </div>
        </div>

        {/* Recent Bets */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Paris récents</h2>
          <div className="space-y-3">
            {stats.recent.bets.length > 0 ? (
              stats.recent.bets.slice(0, 5).map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">
                      {bet.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(bet.placed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      bet.status === 'won'
                        ? 'bg-green-500/20 text-green-400'
                        : bet.status === 'lost'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {bet.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">Aucun pari récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
