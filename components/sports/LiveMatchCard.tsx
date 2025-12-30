'use client'

import { Play, Tv, BarChart3, Heart, TrendingUp, TrendingDown, ChevronDown, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  half?: string // e.g., "1ère mi-temps", "2ème mi-temps"
}

interface Odds {
  selection: string
  odds: number
  change?: 'up' | 'down' | 'same'
  label?: string // e.g., "Plus de 3.5", "Moins de 3.5", "1", "Match nul", "2"
}

interface LiveMatchCardProps {
  match: Match
  odds?: Odds[]
  onOddsClick?: (matchId: string, selection: string, odds: number) => void
  onWatch?: (matchId: string) => void
  onStats?: (matchId: string) => void
  onFavorite?: (matchId: string) => void
  variant?: 'carousel' | 'grid'
  showAllMarkets?: boolean
}

export default function LiveMatchCard({
  match,
  odds = [],
  onOddsClick,
  onWatch,
  onStats,
  onFavorite,
  variant = 'grid',
  showAllMarkets = false
}: LiveMatchCardProps) {
  const router = useRouter()
  const isLive = match.is_live || match.status === 'live'
  const isCarousel = variant === 'carousel'

  const getStatusText = () => {
    if (isLive && match.match_minute) {
      if (match.half) {
        return `${match.match_minute}' ${match.half}`
      }
      return `${match.match_minute}'`
    }
    if (match.status === 'half-time') {
      return 'Mi-temps'
    }
    if (match.match_time) {
      return match.match_time
    }
    return match.status
  }

  const handleAllMarketsClick = () => {
    router.push(`/sports/matches/${match.id}`)
  }

  const handleCardClick = () => {
    router.push(`/sports/matches/${match.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-lg border overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
        isCarousel && isLive
          ? 'bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-purple-900/50 border-purple-500/50'
          : 'bg-bg-secondary border-border-primary'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-2 ${isCarousel ? 'bg-transparent' : 'bg-bg-tertiary/50'} border-b border-border-primary/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-text-secondary font-medium">
                  {getStatusText()}
                </span>
              </div>
            )}
            {!isLive && (
              <span className="text-xs text-text-secondary">
                {getStatusText()}
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary">
            {match.league_name || match.sport_name}
          </span>
        </div>
      </div>

      {/* Match Content */}
      <div className="p-4">
        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.home_team_logo ? (
              <img
                src={match.home_team_logo}
                alt={match.home_team}
                className="w-10 h-10 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-text-secondary">
                  {match.home_team.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-text-primary font-semibold truncate">
              {match.home_team}
            </span>
            <span className="text-xl font-bold text-text-primary ml-2">
              {match.home_score}
            </span>
          </div>

          {/* Score Separator */}
          <div className="px-2 text-text-secondary">-</div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse">
            {match.away_team_logo ? (
              <img
                src={match.away_team_logo}
                alt={match.away_team}
                className="w-10 h-10 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-text-secondary">
                  {match.away_team.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-text-primary font-semibold truncate text-right">
              {match.away_team}
            </span>
            <span className="text-xl font-bold text-text-primary mr-2">
              {match.away_score}
            </span>
          </div>
        </div>

        {/* Odds Buttons or All Markets Button */}
        {showAllMarkets ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAllMarketsClick()
            }}
            className="w-full px-4 py-2.5 bg-bg-tertiary hover:bg-accent-primary hover:text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Passer à Tous les marchés
          </button>
        ) : odds.length > 0 ? (
          <div className="flex gap-2 mb-3">
            {odds.map((odd, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onOddsClick?.(match.id, odd.selection, odd.odds)
                }}
                className="flex-1 px-3 py-2 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 group"
              >
                <span className="text-xs font-semibold">{odd.label || odd.selection}</span>
                <span className="text-sm font-bold">{odd.odds.toFixed(2)}</span>
                {odd.change === 'up' && (
                  <TrendingUp className="w-3 h-3 text-green-500 group-hover:text-white" />
                )}
                {odd.change === 'down' && (
                  <TrendingDown className="w-3 h-3 text-red-500 group-hover:text-white" />
                )}
                {index === odds.length - 1 && (
                  <ChevronDown className="w-3 h-3 opacity-50" />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}


import { Play, Tv, BarChart3, Heart, TrendingUp, TrendingDown, ChevronDown, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  half?: string // e.g., "1ère mi-temps", "2ème mi-temps"
}

interface Odds {
  selection: string
  odds: number
  change?: 'up' | 'down' | 'same'
  label?: string // e.g., "Plus de 3.5", "Moins de 3.5", "1", "Match nul", "2"
}

interface LiveMatchCardProps {
  match: Match
  odds?: Odds[]
  onOddsClick?: (matchId: string, selection: string, odds: number) => void
  onWatch?: (matchId: string) => void
  onStats?: (matchId: string) => void
  onFavorite?: (matchId: string) => void
  variant?: 'carousel' | 'grid'
  showAllMarkets?: boolean
}

export default function LiveMatchCard({
  match,
  odds = [],
  onOddsClick,
  onWatch,
  onStats,
  onFavorite,
  variant = 'grid',
  showAllMarkets = false
}: LiveMatchCardProps) {
  const router = useRouter()
  const isLive = match.is_live || match.status === 'live'
  const isCarousel = variant === 'carousel'

  const getStatusText = () => {
    if (isLive && match.match_minute) {
      if (match.half) {
        return `${match.match_minute}' ${match.half}`
      }
      return `${match.match_minute}'`
    }
    if (match.status === 'half-time') {
      return 'Mi-temps'
    }
    if (match.match_time) {
      return match.match_time
    }
    return match.status
  }

  const handleAllMarketsClick = () => {
    router.push(`/sports/matches/${match.id}`)
  }

  const handleCardClick = () => {
    router.push(`/sports/matches/${match.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-lg border overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
        isCarousel && isLive
          ? 'bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-purple-900/50 border-purple-500/50'
          : 'bg-bg-secondary border-border-primary'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-2 ${isCarousel ? 'bg-transparent' : 'bg-bg-tertiary/50'} border-b border-border-primary/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-text-secondary font-medium">
                  {getStatusText()}
                </span>
              </div>
            )}
            {!isLive && (
              <span className="text-xs text-text-secondary">
                {getStatusText()}
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary">
            {match.league_name || match.sport_name}
          </span>
        </div>
      </div>

      {/* Match Content */}
      <div className="p-4">
        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.home_team_logo ? (
              <img
                src={match.home_team_logo}
                alt={match.home_team}
                className="w-10 h-10 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-text-secondary">
                  {match.home_team.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-text-primary font-semibold truncate">
              {match.home_team}
            </span>
            <span className="text-xl font-bold text-text-primary ml-2">
              {match.home_score}
            </span>
          </div>

          {/* Score Separator */}
          <div className="px-2 text-text-secondary">-</div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse">
            {match.away_team_logo ? (
              <img
                src={match.away_team_logo}
                alt={match.away_team}
                className="w-10 h-10 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-text-secondary">
                  {match.away_team.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-text-primary font-semibold truncate text-right">
              {match.away_team}
            </span>
            <span className="text-xl font-bold text-text-primary mr-2">
              {match.away_score}
            </span>
          </div>
        </div>

        {/* Odds Buttons or All Markets Button */}
        {showAllMarkets ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAllMarketsClick()
            }}
            className="w-full px-4 py-2.5 bg-bg-tertiary hover:bg-accent-primary hover:text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Passer à Tous les marchés
          </button>
        ) : odds.length > 0 ? (
          <div className="flex gap-2 mb-3">
            {odds.map((odd, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onOddsClick?.(match.id, odd.selection, odd.odds)
                }}
                className="flex-1 px-3 py-2 bg-bg-tertiary hover:bg-green-500 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 group"
              >
                <span className="text-xs font-semibold">{odd.label || odd.selection}</span>
                <span className="text-sm font-bold">{odd.odds.toFixed(2)}</span>
                {odd.change === 'up' && (
                  <TrendingUp className="w-3 h-3 text-green-500 group-hover:text-white" />
                )}
                {odd.change === 'down' && (
                  <TrendingDown className="w-3 h-3 text-red-500 group-hover:text-white" />
                )}
                {index === odds.length - 1 && (
                  <ChevronDown className="w-3 h-3 opacity-50" />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

