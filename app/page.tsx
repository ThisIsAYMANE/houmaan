'use client'

import { useState, useEffect } from 'react'
import AdBanner from '@/components/layout/AdBanner'
import SearchBar from '@/components/home/SearchBar'
import CategoryGrid from '@/components/home/CategoryGrid'
import CategoryTabs from '@/components/home/CategoryTabs'
import GameCarousel from '@/components/games/GameCarousel'
import GameActivityTable from '@/components/home/GameActivityTable'
import LiveScoresWidget from '@/components/home/LiveScoresWidget'
import { useI18n } from '@/lib/i18n'

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

interface Category {
  id: string
  name: string
  slug: string
}

interface Banner {
  id: string
  title: string
  description?: string
  image_url: string
  link_url?: string
  button_text?: string
  type: string
}

export default function Home() {
  const { t } = useI18n()
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('lobby')
  const [popularGames, setPopularGames] = useState<Game[]>([])
  const [bcOriginauxGames, setBcOriginauxGames] = useState<Game[]>([])
  const [continuePlayingGames, setContinuePlayingGames] = useState<Game[]>([])
  const [recentWins, setRecentWins] = useState<any[]>([])
  const [gameActivities, setGameActivities] = useState<any[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [activityTab, setActivityTab] = useState<'last-bet' | 'top-roll' | 'betting-contest'>('last-bet')

  useEffect(() => {
    loadData()
  }, [activeCategory])

  // Static mock data for preview
  const getMockGames = (): Game[] => [
    {
      id: '1',
      title: 'LIMBO',
      slug: 'limbo',
      thumbnail_url: '',
      provider_name: 'Shartbandee Originals',
      provider_logo: '',
      player_count: 358,
      multiplier: 500,
      is_original: true,
      is_new: false
    },
    {
      id: '2',
      title: 'CRASH TRENBALL',
      slug: 'crash-trenball',
      thumbnail_url: '',
      provider_name: 'Shartbandee Originals',
      provider_logo: '',
      player_count: 2363,
      multiplier: 999,
      is_original: true,
      is_exclusive: true
    },
    {
      id: '3',
      title: 'PLINKO',
      slug: 'plinko',
      thumbnail_url: '',
      provider_name: 'Shartbandee Originals',
      provider_logo: '',
      player_count: 148,
      multiplier: 420,
      is_original: true
    },
    {
      id: '4',
      title: 'Gates of Olympus',
      slug: 'gates-of-olympus',
      thumbnail_url: '',
      provider_name: 'Pragmatic Play',
      provider_logo: '',
      player_count: 3421,
      is_new: true
    },
    {
      id: '5',
      title: 'Sweet Bonanza',
      slug: 'sweet-bonanza',
      thumbnail_url: '',
      provider_name: 'Pragmatic Play',
      provider_logo: '',
      player_count: 5678
    },
    {
      id: '6',
      title: 'Book of Dead',
      slug: 'book-of-dead',
      thumbnail_url: '',
      provider_name: 'Play\'n GO',
      provider_logo: '',
      player_count: 2890
    },
    {
      id: '7',
      title: 'Starburst',
      slug: 'starburst',
      thumbnail_url: '',
      provider_name: 'NetEnt',
      provider_logo: '',
      player_count: 4567
    },
    {
      id: '8',
      title: 'Mega Fortune',
      slug: 'mega-fortune',
      thumbnail_url: '',
      provider_name: 'NetEnt',
      provider_logo: '',
      player_count: 1234,
      is_new: true
    }
  ]

  const getMockWins = () => [
    {
      id: '1',
      game_title: 'LIMBO',
      game_thumbnail: '',
      payout: 12500.50,
      currency: 'EUR'
    },
    {
      id: '2',
      game_title: 'CRASH TRENBALL',
      game_thumbnail: '',
      payout: 8750.25,
      currency: 'EUR'
    },
    {
      id: '3',
      game_title: 'Gates of Olympus',
      game_thumbnail: '',
      payout: 15200.00,
      currency: 'EUR'
    },
    {
      id: '4',
      game_title: 'Sweet Bonanza',
      game_thumbnail: '',
      payout: 9800.75,
      currency: 'EUR'
    },
    {
      id: '5',
      game_title: 'PLINKO',
      game_thumbnail: '',
      payout: 11250.00,
      currency: 'EUR'
    },
    {
      id: '6',
      game_title: 'Book of Dead',
      game_thumbnail: '',
      payout: 6750.50,
      currency: 'EUR'
    }
  ]

  const getMockActivities = () => [
    {
      id: '1',
      game_title: 'Pinata Wins',
      player_username: 'Jimvirt',
      bet_amount: 3.12,
      currency: 'EUR',
      country_flag: '🇵🇭',
      multiplier: 0.00,
      profit: -3.12,
      is_win: false
    },
    {
      id: '2',
      game_title: 'Golden Crown Booster',
      player_username: 'Tegkqbbluoac',
      bet_amount: 1.48,
      currency: 'EUR',
      country_flag: '🟢',
      multiplier: 0.00,
      profit: -1.48,
      is_win: false
    },
    {
      id: '3',
      game_title: 'Gates of Olympus Super S...',
      player_username: 'johnslot89',
      bet_amount: 0.82,
      currency: 'EUR',
      country_flag: '🇮🇩',
      multiplier: 0.00,
      profit: -0.82,
      is_win: false
    },
    {
      id: '4',
      game_title: 'Shartbandee Auto Mega Roul...',
      player_username: 'Hldfdbtqlpyb',
      bet_amount: 10.22,
      currency: 'EUR',
      country_flag: '🇮🇳',
      multiplier: 2.00,
      profit: 10.22,
      is_win: true
    },
    {
      id: '5',
      game_title: 'Coin Strike: Hold and Win',
      player_username: 'Himangsu',
      bet_amount: 0.51,
      currency: 'EUR',
      country_flag: '🇮🇳',
      multiplier: 4.00,
      profit: 1.53,
      is_win: true
    },
    {
      id: '6',
      game_title: 'Mega Bacarrat',
      player_username: 'mrzeroc',
      bet_amount: 71.05,
      currency: 'EUR',
      country_flag: '🇮🇩',
      multiplier: 0.00,
      profit: -71.05,
      is_win: false
    },
    {
      id: '7',
      game_title: 'Sweet Bonanza 1000',
      player_username: 'najznhir07',
      bet_amount: 0.58,
      currency: 'EUR',
      country_flag: '🇨🇿',
      multiplier: 0.00,
      profit: -0.58,
      is_win: false
    },
    {
      id: '8',
      game_title: 'Fortune Gems 2',
      player_username: 'Frclhhtvdycc',
      bet_amount: 0.76,
      currency: 'EUR',
      country_flag: '🇮🇳',
      multiplier: 0.00,
      profit: -0.76,
      is_win: false
    },
    {
      id: '9',
      game_title: 'WUKONG',
      player_username: 'DJDaCoRe',
      bet_amount: 53.64,
      currency: 'EUR',
      country_flag: '🇪🇺',
      multiplier: 0.00,
      profit: -53.64,
      is_win: false
    },
    {
      id: '10',
      game_title: 'Lamp of Wonder',
      player_username: 'Genious123',
      bet_amount: 1.02,
      currency: 'EUR',
      country_flag: '🇮🇳',
      multiplier: 0.00,
      profit: -1.02,
      is_win: false
    }
  ]

  const loadData = async () => {
    setLoading(true)
    try {
      // Load categories
      const categoriesRes = await fetch('/api/games/categories')
      const categoriesData = await categoriesRes.json()
      const loadedCategories = categoriesData.categories || []
      setCategories([
        { id: 'lobby', name: t('home.lobby', 'Lobby'), slug: 'lobby' },
        ...loadedCategories
      ])

      // Load popular games
      const popularRes = await fetch('/api/games/popular?limit=10')
      const popularData = await popularRes.json()
      setPopularGames(popularData.games || [])

      // Load Shartbandee Originaux games
      const bcOriginauxRes = await fetch('/api/games?category=bc-originaux&limit=10')
      const bcOriginauxData = await bcOriginauxRes.json()
      setBcOriginauxGames(bcOriginauxData.games || [])

      // Continue Playing - requires auth, skip for guests
      setContinuePlayingGames([])

      // Load recent wins
      const winsRes = await fetch('/api/games/recent-wins?limit=10')
      const winsData = await winsRes.json()
      setRecentWins(winsData.wins || [])

      // Load game activities from API (or empty)
      setGameActivities([])

      // Load banners (mock data with gradient backgrounds)
      setBanners([
        {
          id: '1',
          title: t('home.ufcBannerTitle', 'UFC ASSURANCE KO'),
          description: t('home.ufcBannerDesc', 'Parier maintenant et gagnez gros!'),
          image_url: '',
          link_url: '/sports',
          button_text: t('home.ufcBannerBtn', 'PARIER MAINTENANT'),
          type: 'ufc'
        },
        {
          id: '2',
          title: t('home.bonusBannerTitle', '180% Bonus de Dépôt'),
          description: t('home.bonusBannerDesc', "S'inscrire -> Dépôt -> Obtenez un bonus"),
          image_url: '',
          link_url: '/wallet',
          button_text: t('home.bonusBannerBtn', 'Dépôsez Maintenant'),
          type: 'bonus'
        },
        {
          id: '3',
          title: t('home.anniversaryBannerTitle', 'ANNIVERSAIRE 2025'),
          description: t('home.anniversaryBannerDesc', "C'EST LA FÊTE CHEZ SHARTBANDEE!"),
          image_url: '',
          link_url: '/promotions',
          button_text: t('home.anniversaryBannerBtn', 'JOUER MAINTENANT'),
          type: 'anniversary'
        },
        {
          id: '4',
          title: t('home.lotteryBannerTitle', 'JACKPOT LOTERIE GRATUITE'),
          description: t('home.lotteryBannerDesc', 'Nouveau joueur? Gagnez un jackpot gratuit!'),
          image_url: '',
          link_url: '/lottery',
          button_text: t('home.lotteryBannerBtn', 'JOUER MAINTENANT'),
          type: 'lottery'
        }
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug)
    // You can load category-specific games here
  }

  const handleGameClick = (game: Game) => {
    if (game.slug) {
      window.location.href = `/games/${game.slug}`
    }
  }

  const handleSearch = (query: string) => {
    // Navigate to games page with search query
    window.location.href = `/games?search=${encodeURIComponent(query)}`
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center">
          <p className="text-text-secondary">{t('common.loading', 'Chargement...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Banner Carousel — real banner images */}
      <AdBanner context="home" />

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Phase 3: Live Scores Widget */}
      <LiveScoresWidget />

      {/* Category Grid */}
      <CategoryGrid />

      {/* Category Tabs */}
      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {/* Game Sections */}
      <div className="space-y-8">
        {/* Continue Playing */}
        {continuePlayingGames.length > 0 && (
          <GameCarousel
            title={t('home.continuePlaying', 'Continuer à jouer')}
            games={continuePlayingGames}
            viewAllHref="/games?recent=true"
            onGameClick={handleGameClick}
          />
        )}

        {/* Shartbandee Originaux */}
        {bcOriginauxGames.length > 0 && (
          <GameCarousel
            title={t('home.originals', 'Shartbandee Originals')}
            games={bcOriginauxGames}
            viewAllHref="/games?category=shartbandee-originaux"
            onGameClick={handleGameClick}
          />
        )}

        {/* Popular Games */}
        {popularGames.length > 0 && (
          <GameCarousel
            title={t('home.popularGames', 'Jeux populaires')}
            games={popularGames}
            viewAllHref="/games?category=jeux-populaires"
            onGameClick={handleGameClick}
            autoScroll={true}
          />
        )}

        {/* Recent Wins Section */}
        {recentWins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              {t('home.recentWins', 'Grandes victoires récentes')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentWins.slice(0, 6).map((win) => (
                <div
                  key={win.id}
                  className="bg-bg-secondary rounded-lg p-4 border border-border-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded bg-gradient-to-br from-accent-primary/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-2xl">🎮</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-text-secondary">
                        {win.game_title}
                      </p>
                      <p className="text-lg font-bold text-accent-primary">
                        {win.payout?.toFixed(2)} {win.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Activity Table */}
        <GameActivityTable
          activities={gameActivities}
          activeTab={activityTab}
          onTabChange={setActivityTab}
        />
      </div>
    </div>
  )
}
