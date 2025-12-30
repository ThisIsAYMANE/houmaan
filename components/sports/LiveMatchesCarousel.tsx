'use client'

import { useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LiveMatchCard from './LiveMatchCard'

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
  sport_slug?: string
  league_name?: string
}

interface Odds {
  selection: string
  odds: number
  change?: 'up' | 'down' | 'same'
}

interface LiveMatchesCarouselProps {
  matches: Match[]
  odds?: Record<string, Odds[]>
  onOddsClick?: (matchId: string, selection: string, odds: number) => void
  onMatchClick?: (matchId: string) => void
}

export default function LiveMatchesCarousel({
  matches,
  odds = {},
  onOddsClick,
  onMatchClick
}: LiveMatchesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      window.addEventListener('resize', checkScrollability)
      return () => {
        container.removeEventListener('scroll', checkScrollability)
        window.removeEventListener('resize', checkScrollability)
      }
    }
  }, [matches])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  if (matches.length === 0) return null

  return (
    <div className="relative">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-bg-secondary/90 hover:bg-bg-tertiary rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-text-primary" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.map((match) => (
          <div key={match.id} className="flex-shrink-0 w-[380px]">
            <LiveMatchCard
              match={match}
              odds={odds[match.id] || []}
              onOddsClick={onOddsClick}
              onWatch={onMatchClick}
              onStats={onMatchClick}
              variant="carousel"
            />
          </div>
        ))}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-bg-secondary/90 hover:bg-bg-tertiary rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <ChevronRight className="w-5 h-5 text-text-primary" />
        </button>
      )}
    </div>
  )
}






import { useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LiveMatchCard from './LiveMatchCard'

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
  sport_slug?: string
  league_name?: string
}

interface Odds {
  selection: string
  odds: number
  change?: 'up' | 'down' | 'same'
}

interface LiveMatchesCarouselProps {
  matches: Match[]
  odds?: Record<string, Odds[]>
  onOddsClick?: (matchId: string, selection: string, odds: number) => void
  onMatchClick?: (matchId: string) => void
}

export default function LiveMatchesCarousel({
  matches,
  odds = {},
  onOddsClick,
  onMatchClick
}: LiveMatchesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      window.addEventListener('resize', checkScrollability)
      return () => {
        container.removeEventListener('scroll', checkScrollability)
        window.removeEventListener('resize', checkScrollability)
      }
    }
  }, [matches])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  if (matches.length === 0) return null

  return (
    <div className="relative">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-bg-secondary/90 hover:bg-bg-tertiary rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-text-primary" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.map((match) => (
          <div key={match.id} className="flex-shrink-0 w-[380px]">
            <LiveMatchCard
              match={match}
              odds={odds[match.id] || []}
              onOddsClick={onOddsClick}
              onWatch={onMatchClick}
              onStats={onMatchClick}
              variant="carousel"
            />
          </div>
        ))}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-bg-secondary/90 hover:bg-bg-tertiary rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <ChevronRight className="w-5 h-5 text-text-primary" />
        </button>
      )}
    </div>
  )
}






