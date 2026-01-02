'use client'

import { Play, Users } from 'lucide-react'

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

  // Determine background gradient based on game type
  const getBackgroundGradient = () => {
    if (isOriginal) {
      return 'bg-gradient-to-b from-green-700 via-green-600 to-green-500'
    }
    if (providerName.includes('Pragmatic')) {
      return 'bg-gradient-to-b from-blue-700 via-blue-600 to-blue-500'
    }
    return 'bg-gradient-to-b from-gray-800 via-gray-700 to-gray-600'
  }

  return (
    <div
      className="group relative flex-shrink-0 w-[180px] cursor-pointer snap-start"
      onClick={onClick}
    >
      {/* Card Container */}
      <div className={`relative rounded-lg overflow-hidden border border-border-primary hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/20 transition-all duration-200 ${getBackgroundGradient()}`}>
        {/* Card Content - Horizontal Layout */}
        <div className="relative h-[240px] flex items-center justify-center">
          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isExclusive && (
              <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded shadow-lg">
                EXCLUSIF
              </span>
            )}
            {isOriginal && (
              <span className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded shadow-lg">
                ORIGINAL
              </span>
            )}
            {isNew && (
              <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-lg">
                NOUVEAU
              </span>
            )}
          </div>

          {/* Multiplier Badge - Top Right */}
          {multiplier && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded shadow-lg z-10">
              {multiplier}x
            </div>
          )}

          {/* Center Graphic/Play Button - Always visible but smaller */}
          <div className="relative z-0">
            <div className="w-24 h-24 flex items-center justify-center">
              <Play className="w-20 h-20 text-white/80 transition-transform" />
            </div>
          </div>

          {/* Hover Overlay with Large Play Button */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 rounded-lg">
            <div className="bg-white/10 backdrop-blur-md rounded-full p-8 border-2 border-white/30 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl">
              <Play className="w-20 h-20 text-white fill-white drop-shadow-lg" />
            </div>
          </div>

          {/* Footer Bar - Bottom */}
          <div className={`absolute bottom-0 left-0 right-0 ${isOriginal ? 'bg-green-800/90' : providerName.includes('Pragmatic') ? 'bg-blue-800/90' : 'bg-gray-900/90'} backdrop-blur-sm px-3 py-2 flex items-center justify-between z-10`}>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-semibold">{playerCount.toLocaleString('en-US')}</span>
            </div>
            <span className="text-white text-xs font-semibold">{providerName}</span>
          </div>
        </div>
      </div>

      {/* Title and Provider Below Card */}
      <div className="mt-2">
        <h3 className="text-base font-bold text-white line-clamp-1">{title}</h3>
        <p className="text-sm text-text-secondary mt-0.5">{providerName}</p>
      </div>
    </div>
  )
}

