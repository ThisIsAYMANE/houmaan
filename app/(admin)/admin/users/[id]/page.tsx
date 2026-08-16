'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, User, Wallet, TrendingUp, CreditCard, Gift,
  ShieldAlert, Ban, CheckCircle, RefreshCw, Clock, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserDetail {
  id: string
  email: string
  username: string | null
  phone: string | null
  is_active: number
  is_admin: number
  kyc_status: string | null
  created_at: string
  last_login: string | null
}

interface UserWallet {
  balance: number
  bonus_balance: number
  locked_balance: number
  currency: string
}

const ACTIVITY_TABS = ['bets', 'deposits', 'withdrawals', 'bonuses'] as const
type ActivityTab = typeof ACTIVITY_TABS[number]

const TAB_LABELS: Record<ActivityTab, string> = {
  bets: 'Paris',
  deposits: 'Dépôts',
  withdrawals: 'Retraits',
  bonuses: 'Bonus',
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    won: 'bg-green-500/20 text-green-400',
    lost: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
    active: 'bg-blue-500/20 text-blue-400',
    forfeited: 'bg-gray-500/20 text-gray-400',
    expired: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[status] ?? 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [activeTab, setActiveTab] = useState<ActivityTab>('bets')
  const [activityData, setActivityData] = useState<any[]>([])
  const [activityTotal, setActivityTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : ''

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { toast.error('Utilisateur introuvable'); router.push('/admin/users'); return }
      const data = await res.json()
      const u = data.data ?? data.user ?? data
      setUser(u.user ?? u)
      setWallet(u.wallet ?? null)
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [id, token, router])

  const fetchActivity = useCallback(async (tab: ActivityTab, pg = 1) => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}/activity?tab=${tab}&page=${pg}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setActivityData(data.data ?? [])
        setActivityTotal(data.total ?? 0)
      }
    } catch {}
    setActivityLoading(false)
  }, [id, token])

  useEffect(() => { fetchUser() }, [fetchUser])
  useEffect(() => { fetchActivity(activeTab, 1); setPage(1) }, [activeTab, fetchActivity])

  const handleToggleActive = async () => {
    if (!user) return
    const newStatus = user.is_active ? 0 : 1
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      })
      if (res.ok) {
        setUser(u => u ? { ...u, is_active: newStatus } : u)
        toast.success(newStatus ? 'Utilisateur activé' : 'Utilisateur banni')
      }
    } catch { toast.error('Erreur') }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-gray-500">Chargement...</div>
  }
  if (!user) return null

  const formatDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const totalPages = Math.ceil(activityTotal / 20)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.push('/admin/users')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux utilisateurs
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.username ?? user.email}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={user.is_active ? 'active' : 'banned'} />
                {user.is_admin ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-400">Admin</span> : null}
                {user.kyc_status ? <StatusBadge status={user.kyc_status} /> : null}
              </div>
            </div>
          </div>
          {/* Admin actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                user.is_active
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
              }`}
            >
              {user.is_active ? <><Ban className="w-4 h-4" /> Bannir</> : <><CheckCircle className="w-4 h-4" /> Activer</>}
            </button>
            <button onClick={fetchUser} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Info + Wallet grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> Profil
          </h2>
          {[
            ['Email', user.email],
            ['Nom d\'utilisateur', user.username ?? '—'],
            ['Téléphone', user.phone ?? '—'],
            ['Inscription', formatDate(user.created_at)],
            ['Dernière connexion', formatDate(user.last_login)],
            ['KYC', user.kyc_status ?? 'Non vérifié'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Wallet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gray-400" /> Portefeuille
          </h2>
          {wallet ? (
            <>
              {[
                ['Solde réel', `$${(wallet.balance ?? 0).toFixed(2)}`, 'text-green-500'],
                ['Solde bonus', `$${(wallet.bonus_balance ?? 0).toFixed(2)}`, 'text-blue-400'],
                ['Solde bloqué', `$${(wallet.locked_balance ?? 0).toFixed(2)}`, 'text-yellow-500'],
                ['Devise', wallet.currency ?? 'EUR', 'text-gray-900 dark:text-white'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun portefeuille</p>
          )}
        </div>
      </div>

      {/* Activity tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {ACTIVITY_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-green-500 border-b-2 border-green-500 bg-green-500/5'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activityLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
          ) : activityData.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucune activité dans cet onglet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activityData.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-xs font-mono truncate max-w-[80px]">
                        {row.id?.slice(0, 8)}…
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">
                        ${(row.amount ?? row.bonus_amount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-2.5 text-gray-500 dark:text-gray-400 text-xs text-right">
                        {formatDate(row.placed_at ?? row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">{activityTotal} entrées</p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchActivity(activeTab, p) }}
                  className="px-3 py-1.5 rounded text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Page {page}/{totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { const p = page + 1; setPage(p); fetchActivity(activeTab, p) }}
                  className="px-3 py-1.5 rounded text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
