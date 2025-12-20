'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LiveMatchCard from '@/components/sports/LiveMatchCard'
import LiveMatchesCarousel from '@/components/sports/LiveMatchesCarousel'
import BottomActionBar from '@/components/sports/BottomActionBar'
import BetSlip from '@/components/sports/BetSlip'
import SportsSearch from '@/components/sports/SportsSearch'
import { Basketball, Tennis, Trophy, Activity, Crown, Radio } from 'lucide-react'
import { mockMatches } from '@/lib/mockData'

interface Match {
  id: string
  home_team: string
  away_team: string
  home_team_logo?: string
  away_team_logo?: string
  home_score: number
  away_score: number
  status: string
  match_time?: string
  match_minute?: number
  is_live: boolean
  sport_name?: string
  sport_slug?: string
  league_name?: string
  half?: string
}

interface Sport {
  id: string
  name: string
  slug: string
  icon?: string
}

const sports: Sport[] = [
  { id: '1', name: 'Football', slug: 'football' },
  { id: '2', name: 'Basketball', slug: 'basketball' },
  { id: '3', name: 'Tennis', slug: 'tennis' },
  { id: '4', name: 'Hockey', slug: 'hockey' },
  { id: '5', name: 'Volleyball', slug: 'volleyball' },
  { id: '6', name: 'Baseball', slug: 'baseball' },
  { id: '7', name: 'eFootball', slug: 'efootball' },
  { id: '8', name: 'eFootball: Volta', slug: 'efootball-volta' },
  { id: '9', name: 'Hockey sur glace', slug: 'ice-hockey' },
  { id: '10', name: 'Handball', slug: 'handball' },
  { id: '11', name: 'FC 26', slug: 'fc26' },
  { id: '12', name: 'Tennis de table', slug: 'table-tennis' }
]

const getSportIcon = (slug: string) => {
  switch (slug) {
    case 'football':
      return Activity
    case 'basketball':
      return Basketball
    case 'tennis':
      return Tennis
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
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [bets, setBets] = useState<Bet[]>([])
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [selectedSport, activeTab])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      let filteredMatches = [...mockMatches] as Match[]
      
      if (selectedSport) {
        filteredMatches = filteredMatches.filter(m => m.sport_id === selectedSport)
      }
      if (activeTab === 'highlights') {
        filteredMatches = filteredMatches.filter(m => m.is_live)
      }
      
      setMatches(filteredMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
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

  const handlePlaceBet = (totalStake: number) => {
    console.log('Placing bet:', { bets, totalStake })
    // TODO: Implement actual bet placement
    setBets([])
    setBetSlipOpen(false)
  }

  const handleMatchClick = (matchId: string) => {
    router.push(`/sports/matches/${matchId}`)
  }

  const liveMatches = matches.filter(m => m.is_live).map(m => ({
    ...m,
    half: m.match_minute && m.match_minute > 45 ? '2ème mi-temps' : m.match_minute ? '1ère mi-temps' : undefined
  }))
  const upcomingMatches = matches.filter(m => !m.is_live && m.status === 'upcoming')
  const popularMatches = matches.slice(0, 6).map(m => ({
    ...m,
    half: m.match_minute && m.match_minute > 45 ? '2ème mi-temps' : m.match_minute ? '1ère mi-temps' : undefined
  }))

  // Mock odds data
  const getMatchOdds = (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return []
    
    if (match.league_name?.includes('Premier League') || match.league_name?.includes('Bundesliga')) {
      return [
        { selection: '1', odds: 1.1, label: '1' },
        { selection: 'X', odds: 6.0, label: 'Match nul' },
        { selection: '2', odds: 50.0, label: '2', change: 'down' as const }
      ]
    }
    if (match.league_name?.includes('Total')) {
      return [
        { selection: 'over', odds: 4.9, label: 'Plus de 3.5' },
        { selection: 'under', odds: 1.15, label: 'Moins de 3.5', change: 'down' as const }
      ]
    }
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
                matches={liveMatches.slice(0, 6)}
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
                Football
              </button>
              {sports.slice(1).map((sport) => {
                const Icon = getSportIcon(sport.slug) || Trophy
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
                  match={match}
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
                    match={match}
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
