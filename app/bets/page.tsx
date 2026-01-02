'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Clock, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface Bet {
  id: string
  match_id: string
  home_team: string
  away_team: string
  bet_type: string
  market_type: string
  selection: string
  odds: number
  amount: number
  potential_payout: number
  status: string
  placed_at: string
  settled_at?: string
  payout_amount?: number
}

export default function BetsPage() {
  const router = useRouter()
  const { isAuthenticated, sessionToken } = useAuthStore()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    fetchBets()
  }, [isAuthenticated, filter])
  
  const fetchBets = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await fetch(`/api/bets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch bets')
      }
      
      const data = await response.json()
      setBets(data.bets || [])
    } catch (error) {
      console.error('Error fetching bets:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'lost':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'lost':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }
  
  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    won: bets.filter(b => b.status === 'won').length,
    lost: bets.filter(b => b.status === 'lost').length,
    totalStaked: bets.reduce((sum, b) => sum + b.amount, 0),
    totalReturns: bets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.payout_amount || 0), 0),
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold text-white">Mes Paris</h1>
        </div>
        <p className="text-text-secondary">Historique et suivi de vos paris sportifs</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-primary">
          <div className="text-text-secondary text-sm mb-1">Total</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-yellow-500/20">
          <div className="text-yellow-500 text-sm mb-1">En cours</div>
          <div className="text-2xl font-bold text-white">{stats.pending}</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-green-500/20">
          <div className="text-green-500 text-sm mb-1">Gagnés</div>
          <div className="text-2xl font-bold text-white">{stats.won}</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-red-500/20">
          <div className="text-red-500 text-sm mb-1">Perdus</div>
          <div className="text-2xl font-bold text-white">{stats.lost}</div>
        </div>
      </div>
      
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-primary">
          <div className="text-text-secondary text-sm mb-1">Total Misé</div>
          <div className="text-2xl font-bold text-white">${stats.totalStaked.toFixed(2)}</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-green-500/20">
          <div className="text-green-500 text-sm mb-1">Total Gains</div>
          <div className="text-2xl font-bold text-white">${stats.totalReturns.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['all', 'pending', 'won', 'lost'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-green-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-white border border-border-primary'
            }`}
          >
            {f === 'all' && 'Tous'}
            {f === 'pending' && 'En cours'}
            {f === 'won' && 'Gagnés'}
            {f === 'lost' && 'Perdus'}
          </button>
        ))}
      </div>
      
      {/* Bets List */}
      {bets.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun pari</h3>
          <p className="text-text-secondary mb-6">
            Vous n'avez pas encore placé de paris dans cette catégorie
          </p>
          <button
            onClick={() => router.push('/sports')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Parier maintenant
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet) => (
            <div
              key={bet.id}
              className="bg-bg-secondary rounded-lg p-4 border border-border-primary hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {bet.home_team} vs {bet.away_team}
                    </h3>
                    {getStatusIcon(bet.status)}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {new Date(bet.placed_at).toLocaleString('fr-FR')}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bet.status)}`}>
                  {bet.status.toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-t border-border-primary">
                <div>
                  <div className="text-xs text-text-secondary mb-1">Sélection</div>
                  <div className="font-semibold text-white">{bet.selection}</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary mb-1">Cote</div>
                  <div className="font-semibold text-green-500">{bet.odds.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary mb-1">Mise</div>
                  <div className="font-semibold text-white">${bet.amount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary mb-1">
                    {bet.status === 'won' ? 'Gain' : 'Gain potentiel'}
                  </div>
                  <div className={`font-semibold ${bet.status === 'won' ? 'text-green-500' : 'text-white'}`}>
                    ${bet.status === 'won' ? bet.payout_amount?.toFixed(2) : bet.potential_payout.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {bet.status === 'won' && bet.settled_at && (
                <div className="mt-3 pt-3 border-t border-border-primary">
                  <div className="text-xs text-text-secondary">
                    Réglé le {new Date(bet.settled_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


