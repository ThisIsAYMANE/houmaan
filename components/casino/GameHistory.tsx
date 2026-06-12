'use client'

import { useState, useEffect } from 'react'
import { History, TrendingUp, TrendingDown, Clock, Trophy } from 'lucide-react'

interface GameSession {
  id: string
  game_id: string
  game_title: string
  game_slug: string
  thumbnail_url?: string
  provider_name: string
  category_name: string
  started_at: string
  ended_at?: string
  total_bet: number
  total_win: number
  session_duration?: number
}

interface GameStatistics {
  totalSessions: number
  totalBet: number
  totalWin: number
  netResult: number
  winRate: string
}

interface FavoriteGame {
  id: string
  title: string
  thumbnail_url?: string
  play_count: number
  total_wagered: number
}

interface GameHistoryProps {
  limit?: number
  showStatistics?: boolean
}

export default function GameHistory({ 
  limit = 20, 
  showStatistics = true 
}: GameHistoryProps) {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [statistics, setStatistics] = useState<GameStatistics | null>(null)
  const [favoriteGames, setFavoriteGames] = useState<FavoriteGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [limit])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/games/history?limit=${limit}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Veuillez vous connecter pour voir votre historique')
        }
        throw new Error('Erreur lors du chargement de l\'historique')
      }

      const data = await response.json()
      setSessions(data.sessions || [])
      setStatistics(data.statistics)
      setFavoriteGames(data.favoriteGames || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-bg-secondary rounded-lg border border-border-primary p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
          <span className="ml-3 text-text-secondary">Chargement de l'historique...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-bg-secondary rounded-lg border border-border-primary p-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {showStatistics && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-bg-secondary rounded-lg border border-border-primary p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Sessions</span>
              <History className="w-5 h-5 text-accent-primary" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {statistics.totalSessions}
            </p>
          </div>

          <div className="bg-bg-secondary rounded-lg border border-border-primary p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Total misé</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(statistics.totalBet)}
            </p>
          </div>

          <div className="bg-bg-secondary rounded-lg border border-border-primary p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Total gagné</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(statistics.totalWin)}
            </p>
          </div>

          <div className="bg-bg-secondary rounded-lg border border-border-primary p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Résultat net</span>
              {statistics.netResult >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              statistics.netResult >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {formatCurrency(statistics.netResult)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Taux de gain: {statistics.winRate}%
            </p>
          </div>
        </div>
      )}

      {/* Favorite Games */}
      {favoriteGames.length > 0 && (
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Jeux favoris
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {favoriteGames.map((game) => (
              <div key={game.id} className="text-center">
                <div className="w-full aspect-square rounded-lg bg-gradient-to-b from-gray-800 to-gray-700 mb-2"></div>
                <p className="text-sm font-semibold text-text-primary truncate">
                  {game.title}
                </p>
                <p className="text-xs text-text-secondary">
                  {game.play_count} session{game.play_count > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="bg-bg-secondary rounded-lg border border-border-primary">
        <div className="p-6 border-b border-border-primary">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <History className="w-5 h-5 text-accent-primary" />
            Historique des sessions
          </h3>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            Aucune session de jeu pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-tertiary">
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Jeu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Misé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Gagné
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Résultat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {sessions.map((session) => {
                  const result = session.total_win - session.total_bet
                  return (
                    <tr key={session.id} className="hover:bg-bg-tertiary transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {session.game_title}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {session.provider_name} • {session.category_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(session.started_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {formatDuration(session.session_duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text-primary">
                        {formatCurrency(session.total_bet)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text-primary">
                        {formatCurrency(session.total_win)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-semibold ${
                          result >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {result >= 0 ? '+' : ''}{formatCurrency(result)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}





