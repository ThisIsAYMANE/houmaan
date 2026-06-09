'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LiveMatchCard from '@/components/sports/LiveMatchCard'
import LiveMatchesCarousel from '@/components/sports/LiveMatchesCarousel'
import BottomActionBar from '@/components/sports/BottomActionBar'
import BetSlip from '@/components/sports/BetSlip'
import SportsSearch from '@/components/sports/SportsSearch'
import { Trophy, Activity, Crown, Radio, Zap, Target } from 'lucide-react'
// Removed mock data import - now using real Odds API data

interface SportsMatch {
  id: string
  home_team: string
  away_team: string
  home_team_logo?: string
  away_team_logo?: string
  home_score?: number
  away_score?: number
  status: string
  match_time?: string
  match_minute?: number
  is_live: boolean
  sport_name?: string // e.g., "American Football" or "Football" (Soccer)
  sport_slug?: string // e.g., "american-football" or "football"
  sport_key?: string // Odds API sport key for filtering
  league_name?: string // e.g., "NFL", "EPL", "NBA"
  half?: string
  odds?: {
    h2h?: {
      home: number
      draw?: number
      away: number
    }
  }
}

interface Sport {
  id: string
  name: string
  slug: string
  icon?: string
}

// Sports will be loaded from Odds API
const defaultSports: Sport[] = [
  { id: 'soccer_epl', name: 'Football', slug: 'football' },
  { id: 'basketball_nba', name: 'Basketball', slug: 'basketball' },
  { id: 'tennis_atp_aus_open_singles', name: 'Tennis', slug: 'tennis' },
  { id: 'icehockey_nhl', name: 'Hockey', slug: 'hockey' },
]

const getSportIcon = (slug: string, sportKey?: string) => {
  // Distinguish between American Football and Football/Soccer
  if (sportKey?.startsWith('americanfootball_')) {
    return Target // Use Target icon for American Football
  }
  
  switch (slug) {
    case 'football':
    case 'soccer':
      return Activity // Activity icon for Football/Soccer
    case 'american-football':
      return Target // Target icon for American Football
    case 'basketball':
      return Target
    case 'tennis':
      return Zap
    case 'ice-hockey':
    case 'hockey':
      return Trophy
    case 'baseball':
      return Trophy
    case 'mma':
      return Zap
    case 'boxing':
      return Target
    case 'rugby-league':
    case 'rugby-union':
      return Trophy
    case 'cricket':
      return Trophy
    default:
      return Trophy
  }
}

interface Bet {
  id: string
  matchId: string
  homeTeam: string
  awayTeam: string
  selection: string
  marketType?: string
  odds: number
  amount: number
  isLive?: boolean
  change?: 'up' | 'down'
}

export default function SportsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'highlights' | 'program' | 'stream'>('highlights')
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [matches, setMatches] = useState<SportsMatch[]>([])
  const [sports, setSports] = useState<Sport[]>(defaultSports)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [bets, setBets] = useState<Bet[]>([])
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)

  // Fetch sports list on mount
  useEffect(() => {
    fetchSports()
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [selectedSport, activeTab])

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports/sports-list')
      if (response.ok) {
        const data = await response.json()
        if (data.sports && data.sports.length > 0) {
          // Map to our Sport format
          const formattedSports = data.sports.map((sport: any) => ({
            id: sport.key,
            name: sport.name,
            slug: sport.slug,
          }))
          setSports(formattedSports)
        }
      }
    } catch (error) {
      console.error('Error fetching sports list:', error)
      // Keep default sports on error
    }
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (selectedSport) {
        params.append('sport_id', selectedSport)
      }
      if (activeTab === 'highlights') {
        params.append('is_live', 'true')
      } else if (activeTab === 'program') {
        params.append('status', 'upcoming')
      }
      // Request all matches - use a very high limit to get everything
      params.append('limit', '10000')
      
      // Fetch from API
      const response = await fetch(`/api/sports/matches?${params.toString()}`)
      const data = await response.json()
      
      if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches)
      } else {
        // No matches found - show empty state
        setMatches([])
        console.log('No matches found for the selected filters')
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      // Show empty state on error instead of mock data
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleOddsClick = (matchId: string, selection: string, odds: number) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return

    const newBet: Bet = {
      id: `${matchId}-${selection}-${Date.now()}`,
      matchId,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      selection,
      marketType: '1x2',
      odds,
      amount: 5,
      isLive: match.is_live,
      change: Math.random() > 0.5 ? 'up' : undefined
    }

    setBets(prev => [...prev, newBet])
    setBetSlipOpen(true)
  }

  const handleRemoveBet = (betId: string) => {
    setBets(prev => prev.filter(b => b.id !== betId))
  }

  const handleClearAll = () => {
    setBets([])
  }

  const handlePlaceBet = async (totalStake: number) => {
    try {
      const token = localStorage.getItem('session_token')
      if (!token) {
        alert('Veuillez vous connecter pour placer un pari')
        router.push('/login')
        return
      }

      // Place each bet
      for (const bet of bets) {
        const response = await fetch('/api/bets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            match_id: bet.matchId,
            bet_type: 'single',
            market_type: bet.marketType || '1x2',
            selection: bet.selection,
            odds: bet.odds,
            amount: bet.amount,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Échec du placement du pari')
        }
      }

      alert('Paris placés avec succès!')
      setBets([])
      setBetSlipOpen(false)
    } catch (error) {
      console.error('Error placing bet:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors du placement du pari')
    }
  }

  const handleMatchClick = (matchId: string) => {
    router.push(`/sports/matches/${matchId}`)
  }

  // Show ALL matches, not just a subset
  const liveMatches = matches.filter(m => m.is_live).map(m => ({
    ...m,
    half: m.match_minute && m.match_minute > 45 ? '2ème mi-temps' : m.match_minute ? '1ère mi-temps' : undefined
  }))
  const upcomingMatches = matches.filter(m => !m.is_live && m.status === 'upcoming')
  // Show ALL matches in popular section, not just 6
  const popularMatches = matches.map(m => ({
    ...m,
    half: m.match_minute && m.match_minute > 45 ? '2ème mi-temps' : m.match_minute ? '1ère mi-temps' : undefined
  }))

  // Get odds from match data (if available from Odds API)
  const getMatchOdds = (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return []
    
    // If match has odds data from Odds API, use it
    if ((match as any).odds?.h2h) {
      const h2h = (match as any).odds.h2h
      return [
        { selection: '1', odds: h2h.home, label: '1' },
        ...(h2h.draw ? [{ selection: 'X', odds: h2h.draw, label: 'Match nul' }] : []),
        { selection: '2', odds: h2h.away, label: '2' }
      ]
    }
    
    // Fallback to default odds if no data available
    return [
      { selection: '1', odds: 1.47, label: '1' },
      { selection: 'X', odds: 4.1, label: 'Match nul' },
      { selection: '2', odds: 5.8, label: '2' }
    ]
  }

  const matchesWithOdds: Record<string, any[]> = {}
  matches.forEach(match => {
    matchesWithOdds[match.id] = getMatchOdds(match.id)
  })

  return (
    <div className="min-h-screen pb-24">
      {/* Top Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-border-primary">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'highlights'
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            TEMPS FORTS
            {activeTab === 'highlights' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'program'
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            UN PROGRAMME
            {activeTab === 'program' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'stream'
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            FLUX DE PARIS
            {activeTab === 'stream' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">Chargement...</div>
      ) : (
        <div className="space-y-8">
          {/* Live Matches Carousel - Only for Highlights */}
          {activeTab === 'highlights' && liveMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-xl font-bold text-text-primary">En Live</h2>
              </div>
              <LiveMatchesCarousel
                matches={liveMatches as any}
                odds={matchesWithOdds}
                onOddsClick={handleOddsClick}
                onMatchClick={handleMatchClick}
              />
            </div>
          )}

          {/* Populaire Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-text-primary">Populaire</h2>
            </div>

            {/* Sport Category Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-2">
              <button
                onClick={() => setSelectedSport(null)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2 ${
                  !selectedSport
                    ? 'bg-green-500 text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <Activity className="w-4 h-4" />
                Tous
              </button>
              {sports.map((sport) => {
                const Icon = getSportIcon(sport.slug, sport.id) || Trophy
                return (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport.id)}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2 ${
                      selectedSport === sport.id
                        ? 'bg-green-500 text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {sport.name}
                  </button>
                )
              })}
            </div>

            {/* Popular Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularMatches.map((match) => (
                <LiveMatchCard
                  key={match.id}
                  match={match as any}
                  odds={matchesWithOdds[match.id] || []}
                  onOddsClick={handleOddsClick}
                  onWatch={handleMatchClick}
                  onStats={handleMatchClick}
                  variant="grid"
                  showAllMarkets={!matchesWithOdds[match.id] || matchesWithOdds[match.id].length === 0}
                />
              ))}
            </div>
          </div>

          {/* Upcoming Matches - Only for Program */}
          {activeTab === 'program' && upcomingMatches.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">À venir</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match) => (
                  <LiveMatchCard
                    key={match.id}
                    match={match as any}
                    odds={matchesWithOdds[match.id] || []}
                    onOddsClick={handleOddsClick}
                    onWatch={handleMatchClick}
                    onStats={handleMatchClick}
                    variant="grid"
                  />
                ))}
              </div>
            </div>
          )}

          {matches.length === 0 && !loading && (
            <div className="text-center py-12 text-text-secondary">
              Aucun match trouvé
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <BottomActionBar
        betCount={bets.length}
        flashBetEnabled={flashBetEnabled}
        onBetSlipClick={() => setBetSlipOpen(!betSlipOpen)}
        onFlashBetToggle={setFlashBetEnabled}
      />

      {/* Bet Slip Drawer */}
      <BetSlip
        isOpen={betSlipOpen}
        bets={bets}
        onClose={() => setBetSlipOpen(false)}
        onRemoveBet={handleRemoveBet}
        onClearAll={handleClearAll}
        onPlaceBet={handlePlaceBet}
        flashBetEnabled={flashBetEnabled}
        onFlashBetToggle={setFlashBetEnabled}
      />
    </div>
  )
}
