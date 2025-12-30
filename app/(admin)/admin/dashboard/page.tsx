'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Gamepad2, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
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
  }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for charts (in production, fetch from API)
  const userGrowthData = [
    { name: 'Lun', users: 120 },
    { name: 'Mar', users: 145 },
    { name: 'Mer', users: 180 },
    { name: 'Jeu', users: 210 },
    { name: 'Ven', users: 250 },
    { name: 'Sam', users: 280 },
    { name: 'Dim', users: 320 },
  ]

  const revenueData = [
    { name: 'Jan', revenue: 45000, deposits: 38000 },
    { name: 'Fév', revenue: 52000, deposits: 42000 },
    { name: 'Mar', revenue: 48000, deposits: 40000 },
    { name: 'Avr', revenue: 61000, deposits: 50000 },
    { name: 'Mai', revenue: 55000, deposits: 45000 },
    { name: 'Juin', revenue: 67000, deposits: 55000 },
  ]

  const betStatusData = [
    { name: 'Gagnés', value: stats?.betting.total ? Math.floor(stats.betting.total * 0.4) : 0 },
    { name: 'Perdus', value: stats?.betting.total ? Math.floor(stats.betting.total * 0.35) : 0 },
    { name: 'En attente', value: stats?.betting.pending || 0 },
    { name: 'Annulés', value: stats?.betting.total ? Math.floor(stats.betting.total * 0.05) : 0 },
  ]

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
      <div>
        <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 mt-2">Vue d'ensemble de votre plateforme</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Utilisateurs totaux</p>
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

        {/* Games Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Jeux</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.games.total}</p>
              <div className="flex items-center mt-2">
                <span className="text-blue-400 text-sm">
                  {stats.games.active} actifs
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Betting Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Paris totaux</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.betting.total}</p>
              <div className="flex items-center mt-2">
                <span className="text-yellow-400 text-sm">
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
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Solde total</p>
              <p className="text-3xl font-bold text-white mt-2">
                {stats.financial.totalBalance.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'MAD',
                  minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-sm">
                  +{stats.financial.totalDeposits.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'MAD',
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Croissance des utilisateurs</h2>
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
        </div>

        {/* Revenue Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Revenus et dépôts</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
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
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenus" />
              <Bar dataKey="deposits" fill="#3b82f6" name="Dépôts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bet Status Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Statut des paris</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={betStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        </div>

        {/* Activity Timeline */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Activité récente</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
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
              <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Utilisateurs récents</h2>
          <div className="space-y-3">
            {stats.recent.users.length > 0 ? (
              stats.recent.users.map((user) => (
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

        {/* Recent Bets */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Paris récents</h2>
          <div className="space-y-3">
            {stats.recent.bets.length > 0 ? (
              stats.recent.bets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">
                      {bet.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'MAD',
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
