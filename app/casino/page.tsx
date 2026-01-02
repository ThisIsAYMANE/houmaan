'use client'

import { useState, useEffect } from 'react'
import { Home, Target, Flame, Star, Tv, Heart, Circle, Dice6, Search, Filter, X } from 'lucide-react'
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

interface Provider {
  id: string
  name: string
  slug: string
  logo_url?: string
}

export default function CasinoPage() {
  const [selectedCategory, setSelectedCategory] = useState('lobby')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [launchedGame, setLaunchedGame] = useState<Game | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories and providers on mount
  useEffect(() => {
    fetchCategories()
    fetchProviders()
  }, [])

  // Fetch games when category or provider changes
  useEffect(() => {
    fetchGames()
  }, [selectedCategory, selectedProvider])

  // Apply search filter
  useEffect(() => {
    if (searchQuery) {
      const filtered = games.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.provider_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredGames(filtered)
    } else {
      setFilteredGames(games)
    }
  }, [searchQuery, games])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/games/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories([
          { id: 'lobby', name: 'Lobby', slug: 'lobby' },
          ...data.categories
        ])
      } else {
        // Fallback to mock data
        setCategories(mockCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(mockCategories)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/games/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchGames = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (selectedCategory !== 'lobby') {
        params.append('category', selectedCategory)
      }
      if (selectedProvider) {
        params.append('provider', selectedProvider)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/games?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setGames(data.games || [])
      } else {
        // Fallback to mock data
        console.log('Using mock data for games')
        if (selectedCategory === 'lobby') {
          setGames(mockGames)
        } else {
          setGames(mockGames.filter(game => game.category_slug === selectedCategory))
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error)
      setError('Failed to load games')
      // Fallback to mock data
      setGames(mockGames)
    } finally {
      setLoading(false)
    }
  }

  const handleGameClick = async (gameId: string) => {
    const game = games.find(g => g.id === gameId) || mockGames.find(g => g.id === gameId)
    if (game) {
      setLaunchedGame(game)
    }
  }

  const handleCloseGame = () => {
    setLaunchedGame(null)
  }

  const clearFilters = () => {
    setSelectedCategory('lobby')
    setSelectedProvider('')
    setSearchQuery('')
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

  const displayGames = searchQuery || selectedProvider ? filteredGames : games
  const activeFiltersCount = (selectedCategory !== 'lobby' ? 1 : 0) + (selectedProvider ? 1 : 0)

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Search and Filters Bar */}
      <div className="sticky top-0 z-40 bg-bg-secondary border-b border-border-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Rechercher des jeux..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary hover:text-text-primary'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="bg-white text-accent-primary rounded-full px-2 py-0.5 text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Provider Filter (shown when filters are open) */}
          {showFilters && providers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-primary">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Fournisseur
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="">Tous les fournisseurs</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.slug}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-[136px] z-30 bg-bg-secondary border-b border-border-primary">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => (
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
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
            <p className="text-text-secondary mt-4">Chargement des jeux...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={fetchGames}
              className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !loading && (
          <div className="mb-6">
            <p className="text-text-secondary">
              {displayGames.length} résultat{displayGames.length !== 1 ? 's' : ''} pour "{searchQuery}"
            </p>
          </div>
        )}

        {/* Games Display */}
        {!loading && !error && (
          <>
            {selectedCategory === 'lobby' && !searchQuery && !selectedProvider ? (
              // Show all categories with carousels
              <div className="space-y-8">
                {categories.slice(1).map((category) => {
                  const categoryGames = games.filter(
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
                        <button
                          onClick={() => setSelectedCategory(category.slug)}
                          className="text-accent-primary hover:text-accent-primary/80 text-sm font-semibold"
                        >
                          Voir tout
                        </button>
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
              // Show filtered/selected category games in grid
              <div>
                {selectedCategory !== 'lobby' && (
                  <h1 className="text-3xl font-bold text-text-primary mb-6 flex items-center gap-2">
                    {getCategoryIcon(selectedCategory)}
                    {categories.find(c => c.slug === selectedCategory)?.name}
                    <span className="text-lg text-text-secondary font-normal">
                      ({displayGames.length})
                    </span>
                  </h1>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayGames.map((game) => (
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

            {/* No Results */}
            {displayGames.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-text-secondary text-lg">
                  {searchQuery 
                    ? 'Aucun jeu ne correspond à votre recherche'
                    : 'Aucun jeu trouvé dans cette catégorie'}
                </p>
              </div>
            )}
          </>
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