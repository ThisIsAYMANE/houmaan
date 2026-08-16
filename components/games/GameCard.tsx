'use client'

import { Users } from 'lucide-react'

interface GameCardProps {
  id?: string
  title?: string
  thumbnailUrl?: string
  providerName?: string
  providerLogo?: string
  playerCount?: number
  multiplier?: number
  isNew?: boolean
  isExclusive?: boolean
  isOriginal?: boolean
  isFeatured?: boolean
  onClick?: () => void
  onPlay?: (id: string) => void
  game?: {
    id: string
    title?: string
    name?: string
    thumbnail_url?: string
    thumbnailUrl?: string
    thumbnail?: string
    provider_name?: string
    providerName?: string
    provider?: string
    provider_logo?: string
    providerLogo?: string
    player_count?: number
    playerCount?: number
    multiplier?: number
    is_new?: boolean
    isNew?: boolean
    is_exclusive?: boolean
    isExclusive?: boolean
    is_original?: boolean
    isOriginal?: boolean
    is_featured?: boolean
    isFeatured?: boolean
    is_favorite?: boolean
  }
}

export default function GameCard(props: GameCardProps) {
  const game = props.game
  const id = props.id || game?.id || ''
  const title = props.title || game?.title || game?.name || ''
  const thumbnailUrl = props.thumbnailUrl || game?.thumbnail_url || game?.thumbnailUrl || game?.thumbnail
  const providerName = props.providerName || game?.provider_name || game?.providerName || game?.provider || ''
  const providerLogo = props.providerLogo || game?.provider_logo || game?.providerLogo
  const playerCount = props.playerCount ?? game?.player_count ?? game?.playerCount ?? 0
  const isOriginal = props.isOriginal ?? game?.is_original ?? game?.isOriginal ?? false
  const isFeatured = props.isFeatured ?? game?.is_featured ?? game?.isFeatured ?? false
  const isFavorite = game?.is_favorite ?? false

  const handleClick = () => {
    if (props.onClick) props.onClick()
    if (props.onPlay) props.onPlay(id)
  }

  return (
    <div
      className="group relative flex-shrink-0 w-[160px] cursor-pointer snap-start"
      onClick={handleClick}
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button
                  aria-label="play"
                  onClick={(e) => { e.stopPropagation(); handleClick() }}
                  className="px-3 py-1 bg-accent-primary text-white text-xs font-bold rounded shadow hover:scale-105 transition-transform"
                >
                  Play
                </button>
                <button
                  aria-label="favorite"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-white hover:text-yellow-400"
                >
                  ★
                </button>
              </div>
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

          {/* Featured badge */}
          {isFeatured && (
            <div className="absolute top-2 right-2 z-10">
              <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded uppercase">
                Featured
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


