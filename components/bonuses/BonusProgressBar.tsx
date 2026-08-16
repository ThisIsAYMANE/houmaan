'use client'

interface BonusProgressBarProps {
  progress: number  // 0–100
  compact?: boolean
}

function getBarColor(pct: number): string {
  if (pct < 33) return 'from-red-500 to-red-400'
  if (pct < 66) return 'from-yellow-500 to-amber-400'
  return 'from-green-500 to-emerald-400'
}

export default function BonusProgressBar({ progress, compact = false }: BonusProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress))
  const colorClass = getBarColor(clamped)

  if (compact) {
    return (
      <div className="w-full h-1.5 bg-background-elevated rounded-full overflow-hidden mt-1">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="w-full h-3 bg-background-elevated rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700 relative`}
          style={{ width: `${clamped}%` }}
        >
          {/* Shimmer animation */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 -left-full w-1/3 bg-white/20 skew-x-12 animate-[shimmer_2s_infinite]"
              style={{ animation: 'shimmer 2s infinite' }}
            />
          </div>
        </div>
      </div>
      {/* Milestone markers */}
      <div className="flex justify-between mt-1">
        {[0, 25, 50, 75, 100].map(marker => (
          <div
            key={marker}
            className={`text-xs ${clamped >= marker ? 'text-accent-primary' : 'text-text-secondary'}`}
          >
            {marker === 0 ? '' : marker === 100 ? '✓' : `${marker}%`}
          </div>
        ))}
      </div>
    </div>
  )
}
