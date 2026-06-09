'use client'

import { useState, useEffect, Suspense } from 'react'
import { Home, Target, Flame, Star, Tv, Heart, Circle, Dice6, Search, Filter, X } from 'lucide-react'
import GameCarousel from '@/components/games/GameCarousel'
import GameCard from '@/components/games/GameCard'
import GameLaunch from '@/components/casino/GameLaunch'
import { mockGames, mockCategories } from '@/lib/mockData'
import { getCachedData, setCachedData, CACHE_KEYS } from '@/lib/client-cache'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

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

function CasinoPageContent() {
  const searchParams = useSearchParams()
  const filterParamsKey = searchParams.toString()
  const { isAuthenticated } = useAuthStore()
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

  // Keep redirected legacy/list URLs in sync with the casino filters.
  useEffect(() => {
    const urlParams = new URLSearchParams(filterParamsKey)
    const nextCategory = urlParams.get('category') || 'lobby'
    const nextProvider = urlParams.get('provider') || ''
    const nextSearch = urlParams.get('search') || ''

    setSelectedCategory(nextCategory)
    setSelectedProvider(nextProvider)
    setSearchQuery(nextSearch)
  }, [filterParamsKey])

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

  // Auto-launch game after login if game parameter is in URL
  useEffect(() => {
    const gameId = searchParams.get('game')
    if (gameId && isAuthenticated && games.length > 0) {
      // Find the game and launch it
      const game = games.find(g => g.id === gameId) || mockGames.find(g => g.id === gameId)
      if (game) {
        setLaunchedGame(game)
        // Clean up URL parameter
        window.history.replaceState({}, '', '/casino')
      }
    }
  }, [searchParams, isAuthenticated, games])

  const fetchCategories = async () => {
    try {
      // Check cache first
      const cached = getCachedData<{ categories: Category[] }>(CACHE_KEYS.CATEGORIES)
      if (cached) {
        // Deduplicate by slug to prevent duplicate keys
        const seenSlugs = new Set<string>(['lobby']) // Start with lobby
        const uniqueCategories = cached.categories.filter(cat => {
          if (seenSlugs.has(cat.slug)) {
            // Only log in development to reduce console noise
            if (process.env.NODE_ENV === 'development') {
              console.debug(`Skipping duplicate category: ${cat.slug}`)
            }
            return false
          }
          seenSlugs.add(cat.slug)
          return true
        })
        
        setCategories([
          { id: 'lobby', name: 'Lobby', slug: 'lobby' },
          ...uniqueCategories
        ])
        return // Use cached data, don't fetch
      }

      // Fetch from API if not cached
      const response = await fetch('/api/games/categories', {
        cache: 'default'
      })
      if (response.ok) {
        const data = await response.json()
        
        // Deduplicate by slug to prevent duplicate keys (safety check)
        const seenSlugs = new Set<string>(['lobby']) // Start with lobby
        const uniqueCategories = (data.categories || []).filter((cat: Category) => {
          if (seenSlugs.has(cat.slug)) {
            // Only log in development to reduce console noise
            if (process.env.NODE_ENV === 'development') {
              console.debug(`Skipping duplicate category from API: ${cat.slug}`)
            }
            return false
          }
          seenSlugs.add(cat.slug)
          return true
        })
        
        const categoriesList = [
          { id: 'lobby', name: 'Lobby', slug: 'lobby' },
          ...uniqueCategories
        ]
        setCategories(categoriesList)
        
        // Cache for 1 hour (cache the deduplicated list)
        setCachedData(CACHE_KEYS.CATEGORIES, { categories: uniqueCategories }, 3600000)
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
      // Check cache first
      const cached = getCachedData<{ providers: Provider[] }>(CACHE_KEYS.PROVIDERS)
      if (cached) {
        setProviders(cached.providers || [])
        return // Use cached data, don't fetch
      }

      // Fetch from API if not cached
      const response = await fetch('/api/games/providers', {
        cache: 'default'
      })
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
        
        // Cache for 1 hour
        setCachedData(CACHE_KEYS.PROVIDERS, { providers: data.providers || [] }, 3600000)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchGames = async () => {
    try {
      // Build query params
      const params = new URLSearchParams()
      if (selectedCategory !== 'lobby') {
        params.append('category', selectedCategory)
      }
      if (selectedProvider) {
        params.append('provider', selectedProvider)
      }
      params.append('limit', '500') // Increased to show more games

      // Create cache key based on filters
      const cacheKey = selectedCategory === 'lobby' && !selectedProvider
        ? CACHE_KEYS.GAMES_LOBBY
        : `${CACHE_KEYS.GAMES}_${selectedCategory}_${selectedProvider || 'all'}`

      // Check cache first
      const cached = getCachedData<{ games: Game[] }>(cacheKey)
      if (cached && cached.games && cached.games.length > 0) {
        setGames(cached.games)
        setLoading(false)
        setError(null)
        return // Use cached data, don't fetch
      }

      // Only show loading if no cache
      setLoading(true)
      setError(null)

      // Fetch from API if not cached
      const response = await fetch(`/api/games?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        const gamesList = data.games || []
        setGames(gamesList)
        
        // Cache for 30 minutes (games change more frequently than categories)
        setCachedData(cacheKey, { games: gamesList }, 1800000)
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
    // Check if user is authenticated before launching game
    // Note: GameLaunch component will also check and show login modal if needed
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
      {/* Top Bar with Search */}
      <div className="sticky top-0 z-40 bg-bg-secondary border-b border-border-primary">
        <div className="container mx-auto px-4 py-3">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Rechercher des jeux..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
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
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-[60px] z-30 bg-bg-secondary border-b border-border-primary">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
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

      {/* Games Content */}
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
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={fetchGames}
              className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Games Display */}
        {!loading && !error && (
          <>
            {selectedCategory === 'lobby' && !searchQuery && !selectedProvider ? (
              // Show all categories with carousels - matching image design
              <div className="space-y-10">
                {categories.slice(1).map((category) => {
                  // Filter games for this specific category
                  const categoryGames = games
                    .filter(game => game.category_slug === category.slug)
                    .slice(0, 20) // Show max 20 games per carousel
                  
                  if (categoryGames.length === 0) return null

                  return (
                    <GameCarousel
                      key={category.id}
                      title={category.name}
                      viewAllHref={`/casino?category=${category.slug}`}
                      onGameClick={(game) => handleGameClick(game.id)}
                    >
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
          gameTitle={launchedGame.title}
          onClose={handleCloseGame}
        />
      )}
    </div>
  )
}

export default function CasinoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
          <p className="text-text-secondary mt-4">Chargement...</p>
        </div>
      </div>
    }>
      <CasinoPageContent />
    </Suspense>
  )
}
