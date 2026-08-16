'use client'

import { useState, useEffect, useCallback } from 'react'
import { Radio, RefreshCw, Trophy, Activity, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LiveScoreOverlay from '@/components/sports/LiveScoreOverlay'

interface LiveScoreEntry {
  id: string
  home_team: string
  away_team: string
  home_score: string | null
  away_score: string | null
  completed: boolean
  sport_key: string
  sport_name?: string
  league_name?: string
}

const SPORT_ICON: Record<string, React.ElementType> = {
  soccer: Activity,
  football: Activity,
  americanfootball: Target,
  basketball: Trophy,
  default: Radio,
}

function getSportIcon(sportKey: string): React.ElementType {
  const prefix = sportKey.split('_')[0]
  return SPORT_ICON[prefix] ?? SPORT_ICON.default
}

// Default sport keys to poll for live scores
const DEFAULT_SPORT_KEYS = [
  'soccer_epl',
  'soccer_uefa_champs_league',
  'americanfootball_nfl',
  'basketball_nba',
  'icehockey_nhl',
]

/**
 * LiveScoresWidget — Phase 3
 * Homepage horizontally-scrollable live scores ticker.
 * Polls /api/sports/scores every 30s, only when page is visible.
 */
export default function LiveScoresWidget() {
  const router = useRouter()
  const [scores, setScores] = useState<LiveScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [failCount, setFailCount] = useState(0)
  const MAX_RETRIES = 3

  const fetchScores = useCallback(async () => {
    // Don't poll when tab is hidden — saves quota
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    // Stop polling after MAX_RETRIES consecutive failures
    if (failCount >= MAX_RETRIES) return

    try {
      const results = await Promise.allSettled(
        DEFAULT_SPORT_KEYS.map(key =>
          fetch(`/api/sports/scores?sport_key=${key}&days_from=1`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      )

      const liveEntries: LiveScoreEntry[] = []
      results.forEach((result, i) => {
        if (result.status !== 'fulfilled' || !result.value?.scoreMap) return
        const { scoreMap } = result.value
        Object.entries(scoreMap).forEach(([id, data]: [string, any]) => {
          // Only show matches with actual scores (not nulls on both sides)
          if (data.home === null && data.away === null) return
          liveEntries.push({
            id,
            home_team: '—',
            away_team: '—',
            home_score: data.home,
            away_score: data.away,
            completed: data.completed,
            sport_key: DEFAULT_SPORT_KEYS[i],
          })
        })
      })

      if (liveEntries.length > 0) {
        setScores(liveEntries.slice(0, 12)) // cap at 12 entries
        setLastUpdate(new Date())
        setFailCount(0) // reset on success
      } else {
        // All returned null/empty — count as a failure for backoff
        setFailCount(prev => prev + 1)
      }
    } catch (error) {
      // Silently increment fail count instead of logging
      setFailCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }, [failCount])

  useEffect(() => {
    fetchScores()

    // Poll every 30s (normal) or with exponential backoff on failures
    const delay = failCount > 0 ? Math.min(30_000 * Math.pow(2, failCount), 300_000) : 30_000
    const interval = setInterval(fetchScores, delay)

    // Pause when tab hidden, resume on focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchScores()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchScores, failCount])


  if (loading) {
    return (
      <div className="w-full px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-36 h-20 rounded-xl bg-bg-secondary border border-border-primary animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (scores.length === 0) {
    return (
      <div className="w-full px-4 py-3">
        <div className="flex items-center gap-2 px-4 py-3 bg-bg-secondary/50 rounded-xl border border-border-primary/50 w-fit">
          <Radio className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">Aucun match en direct pour le moment</span>
        </div>
      </div>
    )
  }

  const liveCount = scores.filter(s => !s.completed).length

  return (
    <div className="w-full py-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-text-primary">Scores en direct</span>
          {liveCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">
              {liveCount} LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-text-tertiary hidden sm:block">
              {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchScores}
            className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-secondary" />
          </button>
          <button
            onClick={() => router.push('/sports')}
            className="text-xs text-accent-primary hover:underline font-medium"
          >
            Voir tout →
          </button>
        </div>
      </div>

      {/* Horizontal scroll ticker */}
      <div className="flex items-stretch gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {scores.map(entry => {
          const Icon = getSportIcon(entry.sport_key)
          return (
            <button
              key={entry.id}
              onClick={() => router.push('/sports')}
              className="flex-shrink-0 w-40 rounded-xl border border-border-primary bg-bg-secondary hover:bg-bg-tertiary transition-all hover:border-accent-primary/40 hover:shadow-md p-3 text-left group"
            >
              {/* Sport icon + status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="text-[10px] text-text-tertiary truncate max-w-[80px]">
                    {entry.sport_key.split('_').slice(1).join(' ').toUpperCase()}
                  </span>
                </div>
                {!entry.completed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>

              {/* Score */}
              <div className="flex items-center justify-center py-1">
                <LiveScoreOverlay
                  homeScore={entry.home_score}
                  awayScore={entry.away_score}
                  isLive={!entry.completed}
                  completed={entry.completed}
                  compact={true}
                />
              </div>

              {/* Teams placeholder */}
              <div className="mt-1.5 text-[10px] text-text-tertiary truncate text-center group-hover:text-text-secondary transition-colors">
                {entry.completed ? 'Terminé' : 'En direct'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
