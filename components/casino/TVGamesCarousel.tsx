'use client'

import { Tv, Users } from 'lucide-react'
import GameCarousel from '@/components/games/GameCarousel'
import GameCard from '@/components/games/GameCard'

interface TVGame {
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

interface TVGamesCarouselProps {
  games: TVGame[]
  onGameClick?: (gameId: string) => void
}

export default function TVGamesCarousel({
  games,
  onGameClick
}: TVGamesCarouselProps) {
  if (games.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Tv className="w-6 h-6 text-accent-primary" />
        <h2 className="text-2xl font-bold text-text-primary">Jeux télévisés</h2>
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
            onClick={() => onGameClick?.(game.id)}
          />
        ))}
      </GameCarousel>
    </div>
  )
}






import { Tv, Users } from 'lucide-react'
import GameCarousel from '@/components/games/GameCarousel'
import GameCard from '@/components/games/GameCard'

interface TVGame {
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

interface TVGamesCarouselProps {
  games: TVGame[]
  onGameClick?: (gameId: string) => void
}




