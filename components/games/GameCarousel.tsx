'use client'

import { useRef, useState, useEffect, Children } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import GameCard from './GameCard'

interface Game {
  id: string
  title: string
  slug: string
  thumbnail_url?: string
  provider_name: string
  provider_logo?: string
  player_count?: number
  multiplier?: number
  is_new?: boolean
  is_exclusive?: boolean
  is_original?: boolean
}

interface GameCarouselProps {
  title?: string
  games?: Game[]
  viewAllHref?: string
  onGameClick?: (game: Game) => void
  autoScroll?: boolean
  children?: React.ReactNode
}

export default function GameCarousel({
  title,
  games,
  viewAllHref,
  onGameClick,
  autoScroll = false,
  children
}: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const isHoveredRef = useRef(false)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = 500 // Adjusted for smaller cards
    const newScrollLeft =
      scrollRef.current.scrollLeft +
      (direction === 'left' ? -scrollAmount : scrollAmount)

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })

    // Update scroll buttons after a short delay
    setTimeout(updateScrollButtons, 100)
  }

  const updateScrollButtons = () => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Support both games prop and children
  const gamesArray = games || []
  const hasChildren = !!children
  const gamesCount = hasChildren ? Children.count(children) : gamesArray.length

  // Duplicate games for infinite scroll (only if using games prop)
  const duplicatedGames = autoScroll && !hasChildren ? [...gamesArray, ...gamesArray, ...gamesArray] : gamesArray

  // Initialize scroll position for infinite scroll
  useEffect(() => {
    if (!autoScroll || !scrollRef.current || gamesCount === 0) return

    const cardWidth = 172 // 160px card + 12px gap
    const firstSetWidth = gamesCount * cardWidth
    
    // Set initial position to the middle set (second set of games) after a short delay
    setTimeout(() => {
      if (scrollRef.current && scrollRef.current.scrollLeft < firstSetWidth) {
        scrollRef.current.scrollLeft = firstSetWidth
      }
    }, 100)
  }, [autoScroll, gamesCount])

  // Handle scroll to create seamless loop
  const handleScroll = () => {
    updateScrollButtons()
    
    if (!autoScroll || !scrollRef.current || gamesCount === 0) {
      return
    }

    const cardWidth = 172 // 160px card + 12px gap
    const singleSetWidth = gamesCount * cardWidth
    const { scrollLeft } = scrollRef.current

    // If we've scrolled past the end of the second set, instantly jump back to the start of the second set
    if (scrollLeft >= singleSetWidth * 2 - 10) {
      scrollRef.current.scrollLeft = singleSetWidth + (scrollLeft - singleSetWidth * 2)
    }
    // If we've scrolled before the start of the second set, instantly jump to the end of the second set
    else if (scrollLeft < singleSetWidth - 10) {
      scrollRef.current.scrollLeft = singleSetWidth * 2 - (singleSetWidth - scrollLeft)
    }
  }

  // Auto-scroll functionality - continuous smooth scrolling
  // Note: Auto-scroll only works with games prop, not with children
  useEffect(() => {
    if (!autoScroll || gamesCount === 0 || hasChildren) return

    let animationFrameId: number | null = null
    let lastTimestamp = 0
    const scrollSpeed = 0.3 // pixels per millisecond (adjust for speed: lower = slower, higher = faster)

    const animate = (timestamp: number) => {
      if (!scrollRef.current) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      // Pause if hovered
      if (isHoveredRef.current) {
        lastTimestamp = 0 // Reset timestamp when paused
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      const deltaTime = timestamp - lastTimestamp
      lastTimestamp = timestamp

      const cardWidth = 172 // 160px card + 12px gap
      const singleSetWidth = gamesCount * cardWidth
      const scrollAmount = scrollSpeed * deltaTime

      // Scroll continuously
      const currentScroll = scrollRef.current.scrollLeft
      const newScroll = currentScroll + scrollAmount

      // Handle infinite loop - if we've scrolled past the end of the second set, jump back
      if (newScroll >= singleSetWidth * 2) {
        scrollRef.current.scrollLeft = singleSetWidth + (newScroll - singleSetWidth * 2)
      } else {
        scrollRef.current.scrollLeft = newScroll
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    // Start animation after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (scrollRef.current) {
        // Ensure we start at the middle set
        const cardWidth = 196
        const firstSetWidth = gamesCount * cardWidth
        if (scrollRef.current.scrollLeft < firstSetWidth) {
          scrollRef.current.scrollLeft = firstSetWidth
        }
        animationFrameId = requestAnimationFrame(animate)
      }
    }, 300)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [autoScroll, isHovered, gamesCount])

  // If using children and no children provided, return null
  if (hasChildren && !children) {
    return null
  }

  // If using games prop and no games, return null
  if (!hasChildren && gamesArray.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      {/* Header - only show if title is provided */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          <div className="flex items-center gap-3">
            {viewAllHref && (
              <a
                href={viewAllHref}
                className="text-text-primary hover:text-text-secondary text-sm font-semibold transition-colors px-3 py-1.5 rounded bg-bg-tertiary hover:bg-bg-primary inline-block"
              >
                Tous
              </a>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="p-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-text-primary" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="p-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-text-primary" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel - horizontal scrollable */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        onScroll={handleScroll}
        onMouseEnter={() => {
          setIsHovered(true)
          isHoveredRef.current = true
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          isHoveredRef.current = false
        }}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {hasChildren ? (
          // Render children if provided
          children
        ) : (
          // Render games from prop
          duplicatedGames.map((game, index) => (
            <GameCard
              key={`${game.id}-${index}`}
              id={game.id}
              title={game.title}
              thumbnailUrl={game.thumbnail_url}
              providerName={game.provider_name}
              providerLogo={game.provider_logo}
              playerCount={game.player_count}
              multiplier={game.multiplier}
              isNew={game.is_new}
              isExclusive={game.is_exclusive}
              isOriginal={game.is_original}
              onClick={() => onGameClick?.(game)}
            />
          ))
        )}
      </div>
    </div>
  )
}
