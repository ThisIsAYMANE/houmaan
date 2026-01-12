'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Star, ChevronUp, ChevronDown, Zap, Megaphone, Pin } from 'lucide-react'
import BottomActionBar from '@/components/sports/BottomActionBar'
import BetSlip from '@/components/sports/BetSlip'
// Removed mock data import - now using real Odds API data

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
  league_name?: string
  league_country?: string
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

interface ExpertTip {
  id: string
  title: string
  bet: string
  option: string
  odds: number
}

const mockBettingMarkets: Record<string, BettingMarket[]> = {
  principal: [
    {
      id: '1x2',
      name: '1x2',
      type: 'match-result',
      options: [
        { label: 'Real Madrid', odds: 1.21 },
        { label: 'Match nul', odds: 7.0 },
        { label: 'FC Séville', odds: 11.0 }
      ]
    },
    {
      id: 'double-chance',
      name: 'Double chance',
      type: 'double-chance',
      options: [
        { label: 'Real Madrid ou Match nul', odds: 1.01 },
        { label: 'Real Madrid ou FC Séville', odds: 1.07 },
        { label: 'Match nul ou FC Séville', odds: 4.2 }
      ]
    },
    {
      id: 'total',
      name: 'Total',
      type: 'total',
      options: [
        { label: 'Plus de 1', odds: 1.02 },
        { label: 'Moins de 1', odds: 12.0 },
        { label: 'Plus de 1.5', odds: 1.11 },
        { label: 'Moins de 1.5', odds: 6.0 },
        { label: 'Plus de 2', odds: 1.16 },
        { label: 'Moins de 2', odds: 5.0 },
        { label: 'Plus de 2.5', odds: 1.38 },
        { label: 'Moins de 2.5', odds: 2.94 },
        { label: 'Plus de 3', odds: 1.58 },
        { label: 'Moins de 3', odds: 2.32 },
        { label: 'Plus de 3.5', odds: 1.94 },
        { label: 'Moins de 3.5', odds: 1.82 },
        { label: 'Plus de 4', odds: 2.62 },
        { label: 'Moins de 4', odds: 1.47 },
        { label: 'Plus de 4.5', odds: 3.1 },
        { label: 'Moins de 4.5', odds: 1.35 },
        { label: 'Plus de 5', odds: 4.8 },
        { label: 'Moins de 5', odds: 1.17 },
        { label: 'Plus de 5.5', odds: 5.2 },
        { label: 'Moins de 5.5', odds: 1.15 },
        { label: 'Plus de 6.5', odds: 8.6 },
        { label: 'Moins de 6.5', odds: 1.07 }
      ]
    }
  ],
  buts: [
    {
      id: 'premiere-but',
      name: 'Première but',
      type: 'first-goal',
      isPinned: true,
      options: [
        { label: 'Real Madrid', odds: 1.24 },
        { label: 'aucun', odds: 21.0 },
        { label: 'FC Séville', odds: 4.1 }
      ]
    }
  ],
  handicaps: [
    {
      id: 'handicap',
      name: 'Handicap',
      type: 'handicap',
      isPinned: true,
      options: [
        { label: '(-4.5) Real Madrid', odds: 8.0 },
        { label: '(4.5) FC Séville', odds: 1.07 },
        { label: '(-4) Real Madrid', odds: 7.0 },
        { label: '(4) FC Séville', odds: 1.08 },
        { label: '(-3.5) Real Madrid', odds: 4.2 },
        { label: '(3.5) FC Séville', odds: 1.21 },
        { label: '(-3) Real Madrid', odds: 3.6 },
        { label: '(3) FC Séville', odds: 1.27 },
        { label: '(-2.5) Real Madrid', odds: 2.42 },
        { label: '(2.5) FC Séville', odds: 1.54 },
        { label: '(-2) Real Madrid', odds: 1.91 },
        { label: '(2) FC Séville', odds: 1.85 },
        { label: '(-1.5) Real Madrid', odds: 1.58 },
        { label: '(1.5) FC Séville', odds: 2.32 },
        { label: '(-1) Real Madrid', odds: 1.28 },
        { label: '(1) FC Séville', odds: 3.55 },
        { label: '(-0.5) Real Madrid', odds: 1.19 },
        { label: '(0.5) FC Séville', odds: 4.5 },
        { label: '(0) Real Madrid', odds: 1.06 },
        { label: '(0) FC Séville', odds: 1.06 }
      ]
    }
  ]
}

const mockExpertTips: ExpertTip[] = [
  {
    id: '1',
    title: 'Lors des 5 dernières rencontres de LaLiga, le Real Madrid a gardé sa cage inviolée lors de 3 matchs contre Séville.',
    bet: '1x2 & Les deux équipes qui marquent',
    option: 'Real Madrid & non',
    odds: 2.05
  },
  {
    id: '2',
    title: 'Lors des 10 derniers affrontements en LaLiga, 6 matchs sur 10 ont eu plus de 2,5 buts, mais les deux équipes ont marqué seulement dans 6 sur 10.',
    bet: 'Total & Les deux équipes qui marquent',
    option: 'plus de 2.5 & non',
    odds: 3.05
  },
  {
    id: '3',
    title: 'Le Real Madrid a marqué au moins 2 buts lors de 7 de ses 10 derniers matchs de LaLiga contre Séville, avec une moyenne de 2,9 buts par match.',
    bet: '1x2 & total',
    option: 'Real Madrid & plus de 2.5',
    odds: 1.5
  },
  {
    id: '4',
    title: 'Lors des 3 derniers matchs à domicile contre Séville en LaLiga, la moyenne de buts était élevée, signe d\'une grande intensité.',
    bet: 'Total cartons',
    option: 'Plus de 4.5',
    odds: 1.85
  }
]

const tabs = [
  { id: 'principal', label: 'Principal', count: 30 },
  { id: 'bet-builder', label: 'Créateur de pari', count: 34 },
  { id: 'half-time', label: 'Mi-temps', count: 33 },
  { id: 'buts', label: 'Buts', count: 27 },
  { id: 'stats', label: 'Statistique', count: 37 },
  { id: 'player-props', label: 'Propriétés de joueur', count: 23 },
  { id: 'extras', label: 'Extras', count: 32 },
  { id: 'handicaps', label: 'Handicaps', count: 10 },
  { id: 'rapide', label: 'Rapide', count: 17, icon: Zap }
]

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [activeTab, setActiveTab] = useState('principal')
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set(['double-chance', 'total']))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [bets, setBets] = useState<any[]>([])
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)

  useEffect(() => {
    if (matchId) {
      fetchMatch()
    }
  }, [matchId])

  const fetchMatch = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch match from API
      const response = await fetch(`/api/sports/matches/${matchId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Match not found')
        }
        throw new Error('Failed to load match')
      }
      
      const data = await response.json()
      if (data.match) {
        setMatch(data.match)
      } else {
        throw new Error('Match data not available')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match')
    } finally {
      setLoading(false)
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
      change: Math.random() > 0.5 ? 'up' as const : undefined
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
    setBets([])
    setBetSlipOpen(false)
  }

  const toggleMarket = (marketId: string) => {
    const newExpanded = new Set(expandedMarkets)
    if (newExpanded.has(marketId)) {
      newExpanded.delete(marketId)
    } else {
      newExpanded.add(marketId)
    }
    setExpandedMarkets(newExpanded)
  }

  const currentMarkets = mockBettingMarkets[activeTab] || []

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
          <p className="text-red-500 mb-4">{error || 'Match not found'}</p>
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
      {/* Match Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-text-secondary text-sm">
            {match.league_country} &gt; {match.league_name}
          </span>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
          <div className="flex items-center justify-between mb-6">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-3 flex-1">
              {match.home_team_logo ? (
                <img
                  src={match.home_team_logo}
                  alt={match.home_team}
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <span className="text-2xl text-text-secondary">
                    {match.home_team.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-xl font-bold text-text-primary text-center">
                {match.home_team}
              </span>
            </div>

            {/* Match Time/Score */}
            <div className="flex flex-col items-center gap-2 px-6">
              {match.is_live ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-text-secondary">
                      {match.match_minute}' {match.match_minute && match.match_minute > 45 ? '2ème mi-temps' : '1ère mi-temps'}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-text-primary">
                    {match.home_score} - {match.away_score}
                  </div>
                </>
              ) : (
                <span className="text-text-secondary">
                  {match.match_time || 'Aujourd\'hui, 21:00'}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-3 flex-1">
              {match.away_team_logo ? (
                <img
                  src={match.away_team_logo}
                  alt={match.away_team}
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <span className="text-2xl text-text-secondary">
                    {match.away_team.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-xl font-bold text-text-primary text-center">
                {match.away_team}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expert Tips */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Conseils d'experts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockExpertTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-bg-secondary rounded-lg border border-border-primary p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <Megaphone className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary flex-1">{tip.title}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border-primary">
                <div>
                  <p className="text-xs text-text-secondary mb-1">{tip.bet}</p>
                  <p className="text-sm font-semibold text-text-primary">{tip.option}</p>
                </div>
                <button
                  onClick={() => handleOddsClick(tip.option, tip.odds)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
                >
                  {tip.odds.toFixed(2)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-border-primary">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2 relative ${
                activeTab === tab.id
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              <span className="text-xs opacity-70">{tab.count}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </button>
          ))}
          <button className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2 flex-shrink-0">
            PAIEMENT ANTICIPÉ
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Betting Markets */}
      <div className="space-y-4">
        {currentMarkets.map((market) => {
          const isExpanded = expandedMarkets.has(market.id)
          const isTotal = market.type === 'total'
          const isHandicap = market.type === 'handicap'

          return (
            <div
              key={market.id}
              className="bg-bg-secondary rounded-lg border border-border-primary overflow-hidden"
            >
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
                      {Array.from({ length: market.options.length / 2 }).map((_, i) => {
                        const overOption = market.options[i * 2]
                        const underOption = market.options[i * 2 + 1]
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
                  ) : isHandicap ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: market.options.length / 2 }).map((_, i) => {
                        const homeOption = market.options[i * 2]
                        const awayOption = market.options[i * 2 + 1]
                        return (
                          <div key={i} className="space-y-2">
                            <button
                              onClick={() => handleOddsClick(homeOption.label, homeOption.odds)}
                              className="w-full px-4 py-3 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors text-left"
                            >
                              <div className="text-sm text-text-secondary mb-1">{homeOption.label}</div>
                              <div className="text-lg font-bold text-text-primary text-right">{homeOption.odds.toFixed(2)}</div>
                            </button>
                            <button
                              onClick={() => handleOddsClick(awayOption.label, awayOption.odds)}
                              className="w-full px-4 py-3 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors text-left"
                            >
                              <div className="text-sm text-text-secondary mb-1">{awayOption.label}</div>
                              <div className="text-lg font-bold text-text-primary text-right">{awayOption.odds.toFixed(2)}</div>
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
