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

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

// Category icons mapping
const getCategoryIcon = (slug: string) => {
  const iconMap: Record<string, any> = {
    'lobby': Home,
    'boz-originaux': Target,
    'popular': Flame,
    'slots': Circle, // Slot machine icon
    'live-casino': Star,
    'tv-games': Tv,
    'table-games': Dice6,
    'poker': Dice6,
    'bingo': Heart,
    'blackjack': Dice6,
    'roulette': Circle,
    'baccarat': Dice6
  }
  return iconMap[slug] || Home
}

export default function CasinoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [launchingGame, setLaunchingGame] = useState<{
    id: string
    url: string
    title: string
  } | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchGames()
  }, [])

  useEffect(() => {
    fetchGames()
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setCategories(mockCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchGames = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      let filteredGames = [...mockGames]
      
      if (selectedCategory) {
        filteredGames = filteredGames.filter(g => g.category_slug === selectedCategory)
      }
      
      setGames(filteredGames)
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGameClick = async (gameId: string) => {
    try {
      const game = games.find(g => g.id === gameId)
      if (!game) return

      setLaunchingGame({
        id: gameId,
        url: game.game_url || 'https://example.com/games/demo',
        title: game.title
      })
    } catch (error) {
      console.error('Error launching game:', error)
    }
  }

  const handleCloseGame = () => {
    setLaunchingGame(null)
  }

  // Filter games by category
  const popularGames = games.filter(g => g.player_count && g.player_count > 0).sort((a, b) => (b.player_count || 0) - (a.player_count || 0))
  const slotGames = games.filter(g => g.category_slug === 'slots' || g.category_slug === 'machines-a-sous')
  const liveCasinoGames = games.filter(g => g.category_slug === 'live-casino' || g.category_slug === 'casino-en-direct')
  const originalGames = games.filter(g => g.is_original)
  const exclusiveGames = games.filter(g => g.is_exclusive)

  return (
    <div className="min-h-screen">
      {/* Category Navigation Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.slug) || Home
            const isActive = selectedCategory === category.slug || (!selectedCategory && category.slug === 'lobby')
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug === 'lobby' ? null : category.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-bg-tertiary text-white'
                    : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-text-secondary'}`} />}
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Game Sections */}
      <div className="space-y-8">
        {/* Jeux populaires */}
        {popularGames.length > 0 && (
          <GameCarousel
            title="Jeux populaires"
            games={popularGames}
            viewAllHref="/casino?category=popular"
            onGameClick={handleGameClick}
            autoScroll={false}
          />
        )}

        {/* Machines à sous */}
        {slotGames.length > 0 && (
          <GameCarousel
            title="Machines à sous"
            games={slotGames}
            viewAllHref="/casino?category=slots"
            onGameClick={handleGameClick}
            autoScroll={false}
          />
        )}

        {/* Casino en direct */}
        {liveCasinoGames.length > 0 && (
          <GameCarousel
            title="Casino en direct"
            games={liveCasinoGames}
            viewAllHref="/casino?category=live-casino"
            onGameClick={handleGameClick}
            autoScroll={false}
          />
        )}

        {/* boz Originaux */}
        {originalGames.length > 0 && (
          <GameCarousel
            title="boz Originaux"
            games={originalGames}
            viewAllHref="/casino?category=boz-originaux"
            onGameClick={handleGameClick}
            autoScroll={false}
          />
        )}

        {/* BC Exclusif */}
        {exclusiveGames.length > 0 && (
          <GameCarousel
            title="BC Exclusif"
            games={exclusiveGames}
            viewAllHref="/casino?category=bc-exclusif"
            onGameClick={handleGameClick}
            autoScroll={false}
          />
        )}

        {/* All Games (if category selected) */}
        {selectedCategory && games.length > 0 && (
          <GameCarousel
            title={`${categories.find(c => c.slug === selectedCategory)?.name || 'Jeux'}`}
            games={games}
            onGameClick={handleGameClick}
            autoScroll={false}
          />
        )}

        {!loading && games.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            Aucun jeu trouvé dans cette catégorie.
          </div>
        )}
      </div>

      {/* Game Launch Modal */}
      {launchingGame && (
        <GameLaunch
          gameId={launchingGame.id}
          gameUrl={launchingGame.url}
          gameTitle={launchingGame.title}
          onClose={handleCloseGame}
        />
      )}
    </div>
  )
}
