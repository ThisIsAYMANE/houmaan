'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
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

interface FavoritesSectionProps {
  onGameClick?: (gameId: string) => void
}

export default function FavoritesSection({ onGameClick }: FavoritesSectionProps) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/games/favorites')
      // if (!response.ok) {
      //   throw new Error('Failed to fetch favorites')
      // }
      // const data = await response.json()
      // setGames(data.games || [])
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
      setGames(mockGames.slice(0, 3)) // First 3 games as favorites
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
      console.error('Error fetching favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGameClick = (gameId: string) => {
    onGameClick?.(gameId)
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Heart className="w-6 h-6 text-accent-primary" />
          Favoris
        </h2>
        <div className="text-text-secondary">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Heart className="w-6 h-6 text-accent-primary" />
          Favoris
        </h2>
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Heart className="w-6 h-6 text-accent-primary" />
          Favoris
        </h2>
        <div className="text-text-secondary py-8 text-center">
          Aucun jeu favori pour le moment. Ajoutez des jeux à vos favoris pour les retrouver facilement.
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Heart className="w-6 h-6 text-accent-primary" />
        Favoris
      </h2>
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

