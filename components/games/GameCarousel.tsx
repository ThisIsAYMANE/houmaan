'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import GameCard from './GameCard'
import Link from 'next/link'

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
  title: string
  games: Game[]
  viewAllHref?: string
  onGameClick?: (game: Game) => void
  autoScroll?: boolean
}

export default function GameCarousel({
  title,
  games,
  viewAllHref,
  onGameClick,
  autoScroll = false
}: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const isHoveredRef = useRef(false)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = 600
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

  // Duplicate games for infinite scroll
  const duplicatedGames = autoScroll ? [...games, ...games, ...games] : games

  // Initialize scroll position for infinite scroll
  useEffect(() => {
    if (!autoScroll || !scrollRef.current || games.length === 0) return

    const cardWidth = 196 // 180px card + 16px gap
    const firstSetWidth = games.length * cardWidth
    
    // Set initial position to the middle set (second set of games) after a short delay
    setTimeout(() => {
      if (scrollRef.current && scrollRef.current.scrollLeft < firstSetWidth) {
        scrollRef.current.scrollLeft = firstSetWidth
      }
    }, 100)
  }, [autoScroll, games.length])

  // Handle scroll to create seamless loop
  const handleScroll = () => {
    updateScrollButtons()
    
    if (!autoScroll || !scrollRef.current || games.length === 0) {
      return
    }

    const cardWidth = 196 // 180px card + 16px gap
    const singleSetWidth = games.length * cardWidth
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
  useEffect(() => {
    if (!autoScroll || games.length === 0) return

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

      const cardWidth = 196 // 180px card + 16px gap
      const singleSetWidth = games.length * cardWidth
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
        const firstSetWidth = games.length * cardWidth
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
  }, [autoScroll, isHovered, games.length])

  if (games.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <div className="flex items-center gap-4">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-accent-primary hover:text-accent-secondary text-sm font-semibold transition-colors"
            >
              Tous
            </Link>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel - horizontal scrollable */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
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
        {duplicatedGames.map((game, index) => (
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
        ))}
      </div>
    </div>
  )
}

