'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// ─── Banner sets by page context ──────────────────────────────────────────────
const BANNER_SETS: Record<string, { src: string; alt: string }[]> = {
  home: [
    { src: '/banners/cassino banner.png', alt: 'Casino bonus' },
    { src: '/banners/sports banner.png', alt: 'Sports betting' },
    { src: '/banners/bonus banner.png', alt: 'Welcome bonus' },
    { src: '/banners/cashback banner.png', alt: 'Cashback offer' },
    { src: '/banners/live support banner.png', alt: 'Live support' },
    { src: '/banners/mobile betting banner.png', alt: 'Mobile betting' },
  ],
  casino: [
    { src: '/banners/cassino banner.png', alt: 'Casino bonus' },
    { src: '/banners/cassino banner 2.png', alt: 'Casino games' },
    { src: '/banners/cassino banner 3.png', alt: 'Casino jackpot' },
    { src: '/banners/cassino banner 4.png', alt: 'Casino slots' },
    { src: '/banners/cassino banner 5.png', alt: 'Casino live' },
  ],
  sports: [
    { src: '/banners/sports banner.png', alt: 'Sports betting' },
    { src: '/banners/sports banner 2.png', alt: 'Sports offers' },
    { src: '/banners/sports banner 3.png', alt: 'Sports live' },
  ],
  bonuses: [
    { src: '/banners/bonus banner.png', alt: 'Welcome bonus' },
    { src: '/banners/cashback banner.png', alt: 'Cashback' },
    { src: '/banners/cashback banner (2).png', alt: 'Cashback offer' },
    { src: '/banners/cashback banner 3.png', alt: 'Cashback deals' },
  ],
}

interface AdBannerProps {
  /** Which banner set to display: 'home' | 'casino' | 'sports' | 'bonuses' */
  context?: keyof typeof BANNER_SETS
  /** Auto-advance interval in ms (default 4000) */
  interval?: number
  /** Can the user dismiss the banner? */
  dismissible?: boolean
  onClose?: () => void
}

export default function AdBanner({
  context = 'home',
  interval = 4000,
  dismissible = false,
  onClose,
}: AdBannerProps) {
  const banners = BANNER_SETS[context] || BANNER_SETS.home
  const [current, setCurrent] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-advance
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length)
    }, interval)
  }, [banners.length, interval])

  useEffect(() => {
    if (!isPaused) startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPaused, startTimer])

  const goTo = (idx: number) => {
    setCurrent(idx)
    startTimer() // reset timer on manual nav
  }

  const prev = () => goTo((current - 1 + banners.length) % banners.length)
  const next = () => goTo((current + 1) % banners.length)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible || banners.length === 0) return null

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden mb-4 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide container */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div key={i} className="w-full flex-shrink-0">
            <img
              src={banner.src}
              alt={banner.alt}
              className="w-full h-auto object-cover"
              style={{ maxHeight: '320px', minHeight: '140px' }}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Prev / Next arrows — visible on hover */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
