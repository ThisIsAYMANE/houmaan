'use client'

import { useState } from 'react'
import { Play, Pause, BarChart3, Users } from 'lucide-react'

interface Match {
  id: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  first_half_score?: string
  second_half_score?: string
  match_minute?: number
  is_live: boolean
}

interface MatchTrackerProps {
  match: Match
}

export default function MatchTracker({ match }: MatchTrackerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 sticky top-4">
      <h3 className="text-lg font-bold text-text-primary mb-4">Suivi du match</h3>

      {/* Scoreboard */}
      <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-text-secondary mb-1">1ère mi-temps</div>
            <div className="text-lg font-bold text-text-primary">
              {match.first_half_score || '0-0'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">2ème mi-temps</div>
            <div className="text-lg font-bold text-text-primary">
              {match.second_half_score || '0-0'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">Total</div>
            <div className="text-lg font-bold text-text-primary">
              {match.home_score}-{match.away_score}
            </div>
          </div>
        </div>
      </div>

      {/* Pitch Visualization */}
      <div className="mb-4">
        <div className="relative w-full h-64 bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden border-2 border-green-800">
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/30 rounded-full"></div>
          
          {/* Home Team (Left) */}
          <div className="absolute top-4 left-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="absolute top-12 left-8">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="absolute bottom-4 left-6">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>

          {/* Away Team (Right) */}
          <div className="absolute top-8 right-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="absolute top-20 right-8">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="absolute bottom-8 right-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>

          {/* Ball */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex-1 px-4 py-2 bg-bg-tertiary hover:bg-accent-primary hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play
            </>
          )}
        </button>
        <button className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary rounded-lg transition-colors">
          <BarChart3 className="w-4 h-4" />
        </button>
        <button className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary rounded-lg transition-colors">
          <Users className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-text-primary mb-2">Événements</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-text-secondary">15' - But ({match.home_team})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-text-secondary">32' - Carton jaune ({match.away_team})</span>
          </div>
        </div>
      </div>
    </div>
  )
}






import { useState } from 'react'
import { Play, Pause, BarChart3, Users } from 'lucide-react'

interface Match {
  id: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  first_half_score?: string
  second_half_score?: string
  match_minute?: number
  is_live: boolean
}

interface MatchTrackerProps {
  match: Match
}

export default function MatchTracker({ match }: MatchTrackerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-6 sticky top-4">
      <h3 className="text-lg font-bold text-text-primary mb-4">Suivi du match</h3>

      {/* Scoreboard */}
      <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-text-secondary mb-1">1ère mi-temps</div>
            <div className="text-lg font-bold text-text-primary">
              {match.first_half_score || '0-0'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">2ème mi-temps</div>
            <div className="text-lg font-bold text-text-primary">
              {match.second_half_score || '0-0'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">Total</div>
            <div className="text-lg font-bold text-text-primary">
              {match.home_score}-{match.away_score}
            </div>
          </div>
        </div>
      </div>

      {/* Pitch Visualization */}
      <div className="mb-4">
        <div className="relative w-full h-64 bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden border-2 border-green-800">
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/30 rounded-full"></div>
          
          {/* Home Team (Left) */}
          <div className="absolute top-4 left-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="absolute top-12 left-8">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="absolute bottom-4 left-6">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>

          {/* Away Team (Right) */}
          <div className="absolute top-8 right-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="absolute top-20 right-8">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="absolute bottom-8 right-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>

          {/* Ball */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex-1 px-4 py-2 bg-bg-tertiary hover:bg-accent-primary hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play
            </>
          )}
        </button>
        <button className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary rounded-lg transition-colors">
          <BarChart3 className="w-4 h-4" />
        </button>
        <button className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary rounded-lg transition-colors">
          <Users className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-text-primary mb-2">Événements</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-text-secondary">15' - But ({match.home_team})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-text-secondary">32' - Carton jaune ({match.away_team})</span>
          </div>
        </div>
      </div>
    </div>
  )
}






