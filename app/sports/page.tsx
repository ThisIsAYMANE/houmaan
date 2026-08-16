'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LiveMatchCard from '@/components/sports/LiveMatchCard'
import LiveMatchesCarousel from '@/components/sports/LiveMatchesCarousel'
import BottomActionBar from '@/components/sports/BottomActionBar'
import BetSlip from '@/components/sports/BetSlip'
import SportsSearch from '@/components/sports/SportsSearch'
import AdBanner from '@/components/layout/AdBanner'
import { useI18n } from '@/lib/i18n'
import { Trophy, Activity, Crown, Radio, Zap, Target, AlertTriangle, RefreshCw } from 'lucide-react'


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
  sport_name?: string
  sport_slug?: string
  sport_key?: string
  league_name?: string
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
  if (sportKey?.startsWith('americanfootball_')) return Target
  switch (slug) {
    case 'football':
    case 'soccer':
      return Activity
    case 'american-football':
      return Target
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

// Issue #F: Track specific error types for user-friendly messages
type FetchError = 'quota_exhausted' | 'api_not_configured' | 'network' | null

export default function SportsPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'highlights' | 'program' | 'stream'>('highlights')
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [matches, setMatches] = useState<SportsMatch[]>([])
  const [sports, setSports] = useState<Sport[]>(defaultSports)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<FetchError>(null)
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null)
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [bets, setBets] = useState<Bet[]>([])
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)
  // Phase 3: live score map keyed by match/event ID
  const [scoreMap, setScoreMap] = useState<Record<string, { home: string | null; away: string | null; completed: boolean; lastUpdate?: string | null }>>( {})

  // Phase 3: defined before the useEffect that depends on it
  const fetchLiveScores = useCallback(async (currentMatches: SportsMatch[]) => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    const liveMatches = currentMatches.filter(m => m.is_live && m.sport_key)
    const uniqueKeys = [...new Set(liveMatches.map(m => m.sport_key!))]
    if (uniqueKeys.length === 0) return
    try {
      const results = await Promise.allSettled(
        uniqueKeys.map(key =>
          fetch(`/api/sports/scores?sport_key=${key}&days_from=1`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      )
      const merged: Record<string, { home: string | null; away: string | null; completed: boolean; lastUpdate?: string | null }> = {}
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.scoreMap) {
          Object.assign(merged, result.value.scoreMap)
        }
      })
      if (Object.keys(merged).length > 0) {
        setScoreMap(prev => ({ ...prev, ...merged }))
      }
    } catch (e) {
      console.error('Live scores fetch error:', e)
    }
  }, [])

  useEffect(() => {
    fetchSports()
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [selectedSport, activeTab])

  // Phase 3: fetch + poll live scores whenever matches change
  useEffect(() => {
    if (matches.length === 0) return
    fetchLiveScores(matches)
    const interval = setInterval(() => fetchLiveScores(matches), 30_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchLiveScores(matches)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [matches, fetchLiveScores])

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports/sports-list')
      if (response.ok) {
        const data = await response.json()
        if (data.sports && data.sports.length > 0) {
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
    }
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setFetchError(null)

      const params = new URLSearchParams()
      if (selectedSport) {
        params.append('sport_id', selectedSport)
      }

      // Issue #5: Tab-specific filtering
      // "TEMPS FORTS" (highlights) = live only
      // "UN PROGRAMME" (program) = upcoming only (no is_live filter, status=upcoming)
      // "FLUX DE PARIS" (stream) = all matches
      if (activeTab === 'highlights') {
        params.append('is_live', 'true')
      } else if (activeTab === 'program') {
        params.append('status', 'upcoming')
      }
      // stream tab: no filter — show everything

      params.append('limit', '10000')

      const response = await fetch(`/api/sports/matches?${params.toString()}`)
      const data = await response.json()

      // Issue #F: Detect quota exhaustion from API response
      if (!response.ok) {
        if (data.error === 'quota_exhausted' || response.status === 429) {
          setFetchError('quota_exhausted')
          setMatches([])
          return
        }
        if (data.error === 'Odds API not configured') {
          setFetchError('api_not_configured')
          setMatches([])
          return
        }
        setFetchError('network')
        setMatches([])
        return
      }

      // Issue #F: Track remaining quota if returned by our API
      if (data.quotaRemaining !== undefined) {
        setQuotaRemaining(data.quotaRemaining)
      }

      if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches)
      } else {
        setMatches([])
        console.log('No matches found for the selected filters')
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      setFetchError('network')
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  // fetchLiveScores moved above useEffects — see line ~115

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
      change: Math.random() > 0.5 ? 'up' : undefined,
    }

    setBets(prev => [...prev, newBet])
    setBetSlipOpen(true)
  }

  const handleRemoveBet = (betId: string) => setBets(prev => prev.filter(b => b.id !== betId))
  const handleClearAll = () => setBets([])

  const handlePlaceBet = async (totalStake: number) => {
    try {
      const token = localStorage.getItem('session_token')
      if (!token) {
        alert('Veuillez vous connecter pour placer un pari')
        router.push('/login')
        return
      }

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
    const match = matches.find(m => m.id === matchId)
    const sportKey = match?.sport_key || ''
    const query = sportKey ? `?sportKey=${encodeURIComponent(sportKey)}` : ''
    router.push(`/sports/matches/${matchId}${query}`)
  }

  // Issue #5: Tab-aware match splitting
  // highlights: show live in carousel + all fetched in grid
  // program: show only upcoming (already filtered by API, just display)
  // stream: show everything
  const liveMatches = matches.filter(m => m.is_live).map(m => ({
    ...m,
    half: m.match_minute && m.match_minute > 45 ? '2ème mi-temps' : m.match_minute ? '1ère mi-temps' : undefined,
  }))
  const upcomingMatches = matches.filter(m => !m.is_live && m.status === 'upcoming')
  const popularMatches = matches.map(m => ({
    ...m,
    half: m.match_minute && m.match_minute > 45 ? '2ème mi-temps' : m.match_minute ? '1ère mi-temps' : undefined,
  }))

  const getMatchOdds = (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return []

    if ((match as any).odds?.h2h) {
      const h2h = (match as any).odds.h2h
      return [
        { selection: '1', odds: h2h.home, label: '1' },
        ...(h2h.draw ? [{ selection: 'X', odds: h2h.draw, label: 'Match nul' }] : []),
        { selection: '2', odds: h2h.away, label: '2' },
      ]
    }

    return [
      { selection: '1', odds: 1.47, label: '1' },
      { selection: 'X', odds: 4.1, label: 'Match nul' },
      { selection: '2', odds: 5.8, label: '2' },
    ]
  }

  const matchesWithOdds: Record<string, any[]> = {}
  matches.forEach(match => {
    matchesWithOdds[match.id] = getMatchOdds(match.id)
  })

  // Issue #F: Error banner for specific failure types
  const ErrorBanner = () => {
    if (!fetchError) return null

    const config = {
      quota_exhausted: {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        title: 'Quota API épuisé',
        message: 'Le quota de requêtes de l\'API des cotes est temporairement épuisé. Les données seront disponibles à nouveau sous peu.',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
      },
      api_not_configured: {
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        title: 'API non configurée',
        message: 'La clé API des cotes n\'est pas configurée. Veuillez contacter l\'administrateur.',
        bg: 'bg-red-500/10 border-red-500/30',
      },
      network: {
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        title: 'Erreur de connexion',
        message: 'Impossible de charger les matchs. Vérifiez votre connexion et réessayez.',
        bg: 'bg-orange-500/10 border-orange-500/30',
      },
    }[fetchError]

    return (
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.bg} mb-6`}>
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-text-primary text-sm">{config.title}</p>
          <p className="text-text-secondary text-sm mt-0.5">{config.message}</p>
        </div>
        <button
          onClick={fetchMatches}
          className="flex-shrink-0 flex items-center gap-1 text-sm text-accent-primary hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Sports Banner Carousel */}
      <div className="mb-4">
        <AdBanner context="sports" />
      </div>

      {/* Top Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-border-primary">
          {/* Issue #5: TEMPS FORTS = live only */}
          <button
            onClick={() => setActiveTab('highlights')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'highlights'
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('sports.highlights', 'TEMPS FORTS')}
            {activeTab === 'highlights' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
            )}
          </button>
          {/* Issue #5: UN PROGRAMME = upcoming only */}
          <button
            onClick={() => setActiveTab('program')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'program'
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('sports.program', 'UN PROGRAMME')}
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
            {t('sports.stream', 'FLUX DE PARIS')}
            {activeTab === 'stream' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
            )}
          </button>
        </div>
      </div>

      {/* Issue #F: Quota/API error banner */}
      <ErrorBanner />

      {/* Low quota warning */}
      {quotaRemaining !== null && quotaRemaining < 50 && quotaRemaining >= 0 && (
        <div className="flex items-center gap-2 px-4 py-2 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Quota API faible : {quotaRemaining} requêtes restantes</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">Chargement...</div>
      ) : (
        <div className="space-y-8">
          {/* Live Matches Carousel - Only for Highlights tab */}
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

          {/* Issue #5: UN PROGRAMME — upcoming matches only */}
          {activeTab === 'program' && (
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">À venir</h2>

              {/* Sport filters */}
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
                {sports.map(sport => {
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

              {upcomingMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingMatches.map(match => (
                    <LiveMatchCard
                      key={match.id}
                      match={match as any}
                      odds={matchesWithOdds[match.id] || []}
                      onOddsClick={handleOddsClick}
                      onWatch={handleMatchClick}
                      onStats={handleMatchClick}
                      variant="grid"
                      liveScore={scoreMap[match.id] ?? null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  Aucun match à venir disponible
                </div>
              )}
            </div>
          )}

          {/* Issue #5: TEMPS FORTS — live matches grid + all popular */}
          {activeTab === 'highlights' && (
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
                {sports.map(sport => {
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
              {liveMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveMatches.map(match => (
                    <LiveMatchCard
                      key={match.id}
                      match={match as any}
                      odds={matchesWithOdds[match.id] || []}
                      onOddsClick={handleOddsClick}
                      onWatch={handleMatchClick}
                      onStats={handleMatchClick}
                      variant="grid"
                      showAllMarkets={!matchesWithOdds[match.id] || matchesWithOdds[match.id].length === 0}
                      liveScore={scoreMap[match.id] ?? null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  Aucun match en direct disponible
                </div>
              )}
            </div>
          )}

          {/* FLUX DE PARIS — all matches */}
          {activeTab === 'stream' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold text-text-primary">Tous les matchs</h2>
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
                {sports.map(sport => {
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

              {popularMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularMatches.map(match => (
                    <LiveMatchCard
                      key={match.id}
                      match={match as any}
                      odds={matchesWithOdds[match.id] || []}
                      onOddsClick={handleOddsClick}
                      onWatch={handleMatchClick}
                      onStats={handleMatchClick}
                      variant="grid"
                      showAllMarkets={!matchesWithOdds[match.id] || matchesWithOdds[match.id].length === 0}
                      liveScore={scoreMap[match.id] ?? null}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  Aucun match disponible
                </div>
              )}
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
