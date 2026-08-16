'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, CheckCircle, XCircle, Clock, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Bet {
  id: string
  user_id: string
  amount: number
  status: string
  placed_at: string
  odds: number
  selection: string
}

export default function BetsPage() {
  const router = useRouter()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
  const [settleModal, setSettleModal] = useState<{ open: boolean; betId: string | null }>({
    open: false, betId: null,
  })
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchBets()
  }, [])

  const fetchBets = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/bets', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.status === 401) { router.push('/admin/login'); return }
      const result = await response.json()
      if (result.success) setBets(result.data || [])
    } catch (error) {
      console.error('Error fetching bets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Phase 2B: Manual settle
  const handleSettle = async (outcome: 'won' | 'lost' | 'void') => {
    if (!settleModal.betId) return
    setSettling(true)
    try {
      const token = localStorage.getItem('admin_session_token')
      const res = await fetch(`/api/admin/bets/${settleModal.betId}/settle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      })
      if (res.ok) {
        toast.success(`Pari réglé comme "${outcome}"`)
        setSettleModal({ open: false, betId: null })
        fetchBets()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erreur')
      }
    } catch { toast.error('Erreur réseau') } finally { setSettling(false) }
  }

  const filteredBets = bets.filter(bet => 
    filter === 'all' || bet.status === filter
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'lost':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return null
    }
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des paris</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gérer tous les paris de la plateforme</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'won' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Gagnés
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'lost' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Perdus
          </button>
        </div>
      </div>

      {/* Bets Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Sélection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Cotes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredBets.length > 0 ? (
                filteredBets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {bet.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {bet.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {bet.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {bet.selection}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {bet.odds.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                          bet.status === 'won'
                            ? 'bg-green-500/20 text-green-400'
                            : bet.status === 'lost'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {getStatusIcon(bet.status)}
                        {bet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(bet.placed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    {/* Phase 2B: Settle action */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bet.status === 'pending' ? (
                        <button
                          onClick={() => setSettleModal({ open: true, betId: bet.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Régler
                        </button>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Aucun pari trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white mt-2">{bets.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">En attente</p>
          <p className="text-2xl font-bold text-yellow-400 mt-2">
            {bets.filter(b => b.status === 'pending').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Gagnés</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {bets.filter(b => b.status === 'won').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Perdus</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {bets.filter(b => b.status === 'lost').length}
          </p>
        </div>
      </div>

      {/* Manual Settle Modal */}
      {settleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettleModal({ open: false, betId: null })} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Régler le pari manuellement</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              ID: <span className="font-mono text-xs">{settleModal.betId?.slice(0, 12)}...</span>
            </p>
            <div className="space-y-3">
              {(['won', 'lost', 'void'] as const).map(outcome => (
                <button
                  key={outcome}
                  disabled={settling}
                  onClick={() => handleSettle(outcome)}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                    outcome === 'won' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    outcome === 'lost' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {settling ? 'Règlement...' : outcome === 'won' ? 'Gagné' : outcome === 'lost' ? 'Perdu' : 'Annulé (remboursement)'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSettleModal({ open: false, betId: null })}
              className="mt-4 w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
