'use client'

import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
import GameCard from '@/components/games/GameCard'
import GameCarousel from '@/components/games/GameCarousel'
import { mockGames } from '@/lib/mockData'

interface Game {
  id: string
  title: string
  slug: string
  thumbnail_url?: string
  provider_name: string
  provider_logo?: string
  player_count?: number
  multiplier?: number
  is_new?: boolean
  is_exclusive?: boolean
  is_original?: boolean
}

interface RecentGamesSectionProps {
  onGameClick?: (gameId: string) => void
}

export default function RecentGamesSection({ onGameClick }: RecentGamesSectionProps) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentGames()
  }, [])

  const fetchRecentGames = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/games/recent')
      // if (!response.ok) {
      //   throw new Error('Failed to fetch recent games')
      // }
      // const data = await response.json()
      // setGames(data.games || [])
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
      setGames(mockGames.slice(3, 6)) // Games 3-6 as recent
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent games')
      console.error('Error fetching recent games:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearRecent = async () => {
    // In a real implementation, you would call an API to clear recent games
    // For now, we'll just clear the local state
    setGames([])
  }

  const handleGameClick = (gameId: string) => {
    onGameClick?.(gameId)
  }

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent-primary" />
            Récent
          </h2>
        </div>
        <div className="text-text-secondary">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent-primary" />
            Récent
          </h2>
        </div>
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent-primary" />
            Récent
          </h2>
        </div>
        <div className="text-text-secondary py-8 text-center">
          Aucun jeu récent. Commencez à jouer pour voir vos jeux récents ici.
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Clock className="w-6 h-6 text-accent-primary" />
          Récent
        </h2>
        <button
          onClick={handleClearRecent}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Effacer
        </button>
      </div>
      <GameCarousel>
        {games.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={game.title}
            thumbnailUrl={game.thumbnail_url}
            providerName={game.provider_name}
            providerLogo={game.provider_logo}
            playerCount={game.player_count || 0}
            multiplier={game.multiplier}
            isNew={game.is_new || false}
            isExclusive={game.is_exclusive || false}
            isOriginal={game.is_original || false}
            onClick={() => handleGameClick(game.id)}
          />
        ))}
      </GameCarousel>
    </div>
  )
}

