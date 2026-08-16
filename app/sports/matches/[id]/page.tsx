'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Star, ChevronUp, ChevronDown, Zap, Pin, AlertCircle } from 'lucide-react'
import BottomActionBar from '@/components/sports/BottomActionBar'
import BetSlip from '@/components/sports/BetSlip'

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
  sport_key?: string
  league_name?: string
  league_country?: string
  odds?: {
    h2h?: { home: number; draw?: number; away: number }
    spreads?: Array<{ team: string; point: number; price: number }>
    totals?: Array<{ over: number; under: number; point: number }>
  }
}

interface BettingMarket {
  id: string
  name: string
  type: string
  isPinned?: boolean
  options: {
    label: string
    odds: number
    change?: 'up' | 'down'
  }[]
}

const tabs = [
  { id: 'principal', label: 'Principal' },
  { id: 'spreads', label: 'Handicaps' },
  { id: 'totals', label: 'Totaux' },
]

/**
 * Transform real odds data from the match API into BettingMarket format
 */
function buildMarketsFromMatch(match: Match): Record<string, BettingMarket[]> {
  const markets: Record<string, BettingMarket[]> = {
    principal: [],
    spreads: [],
    totals: [],
  }

  if (match.odds?.h2h) {
    const { home, draw, away } = match.odds.h2h
    const h2hOptions = [
      { label: match.home_team, odds: home },
      ...(draw !== undefined ? [{ label: 'Match nul', odds: draw }] : []),
      { label: match.away_team, odds: away },
    ]
    markets.principal.push({
      id: '1x2',
      name: draw !== undefined ? '1X2' : 'Résultat du match',
      type: 'match-result',
      options: h2hOptions,
    })
  }

  if (match.odds?.spreads && match.odds.spreads.length > 0) {
    const spreadOptions = match.odds.spreads.flatMap(s => [
      { label: `${s.team} (${s.point > 0 ? '+' : ''}${s.point})`, odds: s.price },
    ])
    if (spreadOptions.length > 0) {
      markets.spreads.push({
        id: 'spreads',
        name: 'Handicap',
        type: 'handicap',
        isPinned: true,
        options: spreadOptions,
      })
    }
  }

  if (match.odds?.totals && match.odds.totals.length > 0) {
    const totalOptions = match.odds.totals.flatMap(t => [
      { label: `Plus de ${t.point}`, odds: t.over },
      { label: `Moins de ${t.point}`, odds: t.under },
    ])
    if (totalOptions.length > 0) {
      markets.totals.push({
        id: 'totals',
        name: 'Total buts',
        type: 'total',
        options: totalOptions,
      })
    }
  }

  return markets
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [bettingMarkets, setBettingMarkets] = useState<Record<string, BettingMarket[]>>({})
  const [activeTab, setActiveTab] = useState('principal')
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set(['1x2', 'totals']))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [bets, setBets] = useState<any[]>([])
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)
  const [oddsLoading, setOddsLoading] = useState(false)

  useEffect(() => {
    if (matchId) {
      fetchMatch()
    }
  }, [matchId])

  const fetchMatch = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch match basic info
      const response = await fetch(`/api/sports/matches/${matchId}`)

      if (!response.ok) {
        if (response.status === 404) throw new Error('Match introuvable')
        throw new Error('Erreur lors du chargement du match')
      }

      const data = await response.json()
      if (data.match) {
        const matchData = data.match
        setMatch(matchData)

        // Build markets from the match's embedded odds
        const markets = buildMarketsFromMatch(matchData)
        setBettingMarkets(markets)

        // If no detailed odds or we need more markets, fetch from odds endpoint
        const hasOdds = Object.values(markets).some(arr => arr.length > 0)
        if (!hasOdds && matchData.sport_key) {
          fetchDetailedOdds(matchData.sport_key)
        }
      } else {
        throw new Error('Données du match non disponibles')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedOdds = async (sportKey: string) => {
    setOddsLoading(true)
    try {
      const response = await fetch(`/api/sports/odds?matchId=${matchId}&sportKey=${sportKey}`)
      if (response.ok) {
        const data = await response.json()
        if (data.match) {
          const markets = buildMarketsFromMatch(data.match)
          setBettingMarkets(markets)
        }
      }
    } catch (err) {
      console.warn('Could not fetch detailed odds:', err)
    } finally {
      setOddsLoading(false)
    }
  }

  const handleOddsClick = (selection: string, odds: number) => {
    if (!match) return
    const newBet = {
      id: `${matchId}-${selection}-${Date.now()}`,
      matchId,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      selection,
      marketType: '1x2',
      odds,
      amount: 5,
      isLive: match.is_live,
    }
    setBets(prev => [...prev, newBet])
    setBetSlipOpen(true)
  }

  const handleRemoveBet = (betId: string) => setBets(prev => prev.filter(b => b.id !== betId))
  const handleClearAll = () => setBets([])
  const handlePlaceBet = () => { setBets([]); setBetSlipOpen(false) }

  const toggleMarket = (marketId: string) => {
    const newExpanded = new Set(expandedMarkets)
    if (newExpanded.has(marketId)) newExpanded.delete(marketId)
    else newExpanded.add(marketId)
    setExpandedMarkets(newExpanded)
  }

  const currentMarkets = bettingMarkets[activeTab] || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error || 'Match introuvable'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="p-1 hover:bg-bg-tertiary rounded">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <span className="text-text-secondary text-sm">
          {match.sport_name} {match.league_name && `> ${match.league_name}`}
        </span>
      </div>

      {/* Match Header */}
      <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-primary">
              {match.home_team_logo ? (
                <img src={match.home_team_logo} alt={match.home_team} className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-text-secondary">{match.home_team.charAt(0)}</span>
              )}
            </div>
            <span className="text-lg font-bold text-text-primary text-center leading-tight">{match.home_team}</span>
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center gap-2 px-4">
            {match.is_live ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-400 font-medium">EN DIRECT</span>
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {match.home_score ?? 0} - {match.away_score ?? 0}
                </div>
                {match.match_minute && (
                  <span className="text-xs text-text-secondary">{match.match_minute}&apos;</span>
                )}
              </>
            ) : (
              <>
                <span className="text-text-secondary text-sm">
                  {match.match_time
                    ? new Date(match.match_time).toLocaleString('fr-FR', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'À venir'}
                </span>
                <div className="text-2xl font-bold text-text-secondary">VS</div>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-primary">
              {match.away_team_logo ? (
                <img src={match.away_team_logo} alt={match.away_team} className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-text-secondary">{match.away_team.charAt(0)}</span>
              )}
            </div>
            <span className="text-lg font-bold text-text-primary text-center leading-tight">{match.away_team}</span>
          </div>
        </div>
      </div>

      {/* Market Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-border-primary">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors flex-shrink-0 relative ${
                activeTab === tab.id
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 text-xs opacity-70">
                {(bettingMarkets[tab.id] || []).length > 0 ? (bettingMarkets[tab.id] || []).length : '—'}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Betting Markets */}
      <div className="space-y-4">
        {oddsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-accent-primary animate-spin mr-2" />
            <span className="text-text-secondary">Chargement des cotes...</span>
          </div>
        )}

        {!oddsLoading && currentMarkets.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Aucune cote disponible pour ce marché</p>
          </div>
        )}

        {currentMarkets.map((market) => {
          const isExpanded = expandedMarkets.has(market.id)
          const isTotal = market.type === 'total'

          return (
            <div key={market.id} className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden">
              {/* Market Header */}
              <button
                onClick={() => toggleMarket(market.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex items-center gap-2">
                  {market.isPinned && <Pin className="w-4 h-4 text-text-secondary" />}
                  <Star className="w-4 h-4 text-text-secondary" />
                  <span className="font-semibold text-text-primary">{market.name}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                )}
              </button>

              {/* Market Options */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {isTotal ? (
                    <div className="space-y-2">
                      {Array.from({ length: Math.floor(market.options.length / 2) }).map((_, i) => {
                        const overOption = market.options[i * 2]
                        const underOption = market.options[i * 2 + 1]
                        if (!overOption || !underOption) return null
                        return (
                          <div key={i} className="flex gap-2">
                            <button
                              onClick={() => handleOddsClick(overOption.label, overOption.odds)}
                              className="flex-1 px-4 py-3 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors text-left"
                            >
                              <div className="text-sm text-text-secondary mb-1">{overOption.label}</div>
                              <div className="text-lg font-bold text-text-primary">{overOption.odds.toFixed(2)}</div>
                            </button>
                            <button
                              onClick={() => handleOddsClick(underOption.label, underOption.odds)}
                              className="flex-1 px-4 py-3 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors text-left"
                            >
                              <div className="text-sm text-text-secondary mb-1">{underOption.label}</div>
                              <div className="text-lg font-bold text-text-primary">{underOption.odds.toFixed(2)}</div>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {market.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleOddsClick(option.label, option.odds)}
                          className="flex-1 px-4 py-3 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors text-center"
                        >
                          <div className="text-sm text-text-secondary mb-1">{option.label}</div>
                          <div className="text-lg font-bold text-text-primary">{option.odds.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

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
