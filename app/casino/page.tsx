'use client'

import { useState, useEffect } from 'react'
import { Home, Target, Flame, Star, Tv, Heart, Circle, Dice6 } from 'lucide-react'
import GameCarousel from '@/components/games/GameCarousel'
import GameCard from '@/components/games/GameCard'
import GameLaunch from '@/components/casino/GameLaunch'
import { mockGames, mockCategories } from '@/lib/mockData'
import Link from 'next/link'

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
  category_slug?: string
  provider_slug?: string
}

export default function CasinoPage() {
  const [selectedCategory, setSelectedCategory] = useState('lobby')
  const [launchedGame, setLaunchedGame] = useState<Game | null>(null)
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    // Filter games based on selected category
    if (selectedCategory === 'lobby') {
      setGames(mockGames)
    } else {
      setGames(mockGames.filter(game => game.category_slug === selectedCategory))
    }
  }, [selectedCategory])

  const handleGameClick = (gameId: string) => {
    const game = mockGames.find(g => g.id === gameId)
    if (game) {
      setLaunchedGame(game)
    }
  }

  const handleCloseGame = () => {
    setLaunchedGame(null)
  }

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'lobby':
        return <Home className="w-4 h-4" />
      case 'boz-originaux':
        return <Target className="w-4 h-4" />
      case 'bc-exclusif':
        return <Star className="w-4 h-4" />
      case 'popular':
        return <Flame className="w-4 h-4" />
      case 'slots':
        return <Dice6 className="w-4 h-4" />
      case 'live-casino':
        return <Tv className="w-4 h-4" />
      case 'tv-games':
        return <Tv className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Category Navigation */}
      <div className="sticky top-0 z-30 bg-bg-secondary border-b border-border-primary">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                }`}
              >
                {getCategoryIcon(category.slug)}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 py-6">
        {selectedCategory === 'lobby' ? (
          // Show all categories with carousels
          <div className="space-y-8">
            {mockCategories.slice(1).map((category) => {
              const categoryGames = mockGames.filter(
                game => game.category_slug === category.slug
              )
              if (categoryGames.length === 0) return null

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                      {getCategoryIcon(category.slug)}
                      {category.name}
                    </h2>
                    <Link
                      href={`/casino?category=${category.slug}`}
                      className="text-accent-primary hover:text-accent-primary/80 text-sm font-semibold"
                    >
                      Voir tout
                    </Link>
                  </div>
                  <GameCarousel>
                    {categoryGames.map((game) => (
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
            })}
          </div>
        ) : (
          // Show selected category games in grid
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-6 flex items-center gap-2">
              {getCategoryIcon(selectedCategory)}
              {mockCategories.find(c => c.slug === selectedCategory)?.name}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
            </div>
          </div>
        )}

        {games.length === 0 && selectedCategory !== 'lobby' && (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">Aucun jeu trouvé dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Game Launch Modal */}
      {launchedGame && (
        <GameLaunch
          gameId={launchedGame.id}
          gameUrl={launchedGame.thumbnail_url || '/placeholder-game.jpg'}
          gameTitle={launchedGame.title}
          onClose={handleCloseGame}
        />
      )}
    </div>
  )
}