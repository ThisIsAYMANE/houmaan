'use client'

import { useEffect, useRef, useState } from 'react'

interface LiveScoreOverlayProps {
  homeScore: string | number | null | undefined
  awayScore: string | number | null | undefined
  isLive: boolean
  minute?: number | null
  half?: string | null
  completed?: boolean
  compact?: boolean
}

/**
 * LiveScoreOverlay — Phase 3
 * Displays live scores with pulsing LIVE badge and animated score changes.
 * Used inside LiveMatchCard and the homepage ticker.
 */
export default function LiveScoreOverlay({
  homeScore,
  awayScore,
  isLive,
  minute,
  half,
  completed = false,
  compact = false,
}: LiveScoreOverlayProps) {
  const [flash, setFlash] = useState(false)
  const prevScore = useRef<string>('')

  const displayHome = homeScore !== null && homeScore !== undefined ? String(homeScore) : '—'
  const displayAway = awayScore !== null && awayScore !== undefined ? String(awayScore) : '—'
  const scoreKey = `${displayHome}-${displayAway}`

  // Flash green when score changes
  useEffect(() => {
    if (prevScore.current && prevScore.current !== scoreKey && isLive) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 1200)
      return () => clearTimeout(t)
    }
    prevScore.current = scoreKey
  }, [scoreKey, isLive])

  const getMinuteText = () => {
    if (completed) return 'FIN'
    if (!isLive) return null
    if (minute) {
      if (half) return `${minute}' ${half}`
      return `${minute}'`
    }
    return 'EN DIRECT'
  }

  const minuteText = getMinuteText()

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {isLive && !completed && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </span>
        )}
        <span
          className={`font-bold tabular-nums transition-colors duration-300 ${
            flash ? 'text-green-400' : 'text-text-primary'
          } ${compact ? 'text-sm' : 'text-xl'}`}
        >
          {displayHome} — {displayAway}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* LIVE badge */}
      {isLive && !completed && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/15 rounded-full border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">
            {minuteText ?? 'Live'}
          </span>
        </div>
      )}
      {completed && (
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Terminé</span>
      )}

      {/* Score */}
      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          flash ? 'scale-110' : 'scale-100'
        }`}
      >
        <span
          className={`text-2xl font-bold tabular-nums transition-colors duration-500 ${
            flash ? 'text-green-400' : 'text-text-primary'
          }`}
        >
          {displayHome}
        </span>
        <span className="text-text-secondary text-lg font-light">—</span>
        <span
          className={`text-2xl font-bold tabular-nums transition-colors duration-500 ${
            flash ? 'text-green-400' : 'text-text-primary'
          }`}
        >
          {displayAway}
        </span>
      </div>
    </div>
  )
}
