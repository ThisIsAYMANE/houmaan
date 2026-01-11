'use client'

import { Users } from 'lucide-react'

interface GameCardProps {
  id: string
  title: string
  thumbnailUrl?: string
  providerName: string
  providerLogo?: string
  playerCount?: number
  multiplier?: number
  isNew?: boolean
  isExclusive?: boolean
  isOriginal?: boolean
  onClick?: () => void
}

export default function GameCard({
  id,
  title,
  thumbnailUrl,
  providerName,
  providerLogo,
  playerCount = 0,
  multiplier,
  isNew = false,
  isExclusive = false,
  isOriginal = false,
  onClick
}: GameCardProps) {
  return (
    <div
      className="group relative flex-shrink-0 w-[160px] cursor-pointer snap-start"
      onClick={onClick}
    >
      {/* Card Container - Square with rounded corners */}
      <div className="relative rounded-lg overflow-hidden bg-bg-tertiary hover:scale-105 transition-transform duration-200 border border-border-primary hover:border-accent-primary">
        {/* Game Image */}
        <div className="relative aspect-square w-full">
          {thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect fill="%23334155" width="160" height="160"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-size="14"%3E' + encodeURIComponent(title) + '%3C/text%3E%3C/svg%3E'
                }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </>
          ) : (
            <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
              <span className="text-text-secondary text-xs text-center px-2">{title}</span>
            </div>
          )}

          {/* Badge - Top Left (for original games) */}
          {isOriginal && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded uppercase">
                JEUX ORIGINAL
              </span>
            </div>
          )}

          {/* Footer - Bottom with player count and provider */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-2 z-10">
            <div className="flex items-center justify-between">
              {/* Player Count */}
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-white" />
                <span className="text-white text-[10px] font-semibold">{playerCount}</span>
              </div>
              {/* Provider Logo/Name */}
              {providerLogo ? (
                <img
                  src={providerLogo}
                  alt={providerName}
                  className="h-3 object-contain"
                />
              ) : (
                <span className="text-white text-[10px] font-semibold truncate max-w-[60px]">
                  {providerName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Title Below Card */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight">{title}</h3>
      </div>
    </div>
  )
}

