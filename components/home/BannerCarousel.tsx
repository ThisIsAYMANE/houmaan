'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Banner {
  id: string
  title: string
  description?: string
  image_url?: string
  imageUrl?: string
  link_url?: string
  linkUrl?: string
  button_text?: string
  buttonText?: string
  type: string
}

interface BannerCarouselProps {
  banners: Banner[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

export default function BannerCarousel({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, banners.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
      {/* Banner - using gradients only */}
      <div className="relative w-full h-full">
        <div className={`w-full h-full flex items-center justify-center ${
          currentBanner.type === 'ufc' 
            ? 'bg-gradient-to-br from-red-900 via-red-800 to-orange-900'
            : currentBanner.type === 'bonus'
            ? 'bg-gradient-to-br from-green-600 via-green-500 to-yellow-500'
            : currentBanner.type === 'anniversary'
            ? 'bg-gradient-to-br from-yellow-600 via-orange-500 to-red-500'
            : currentBanner.type === 'lottery'
            ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-red-500'
            : 'bg-gradient-to-br from-bg-secondary to-bg-tertiary'
        }`}>
          <div className="text-center p-8 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {currentBanner.title}
            </h2>
            {currentBanner.description && (
              <p className="text-xl text-white/90 drop-shadow mb-6">
                {currentBanner.description}
              </p>
            )}
            {currentBanner.linkUrl && (
              <Link
                href={currentBanner.linkUrl}
                className="inline-block bg-accent-primary hover:bg-accent-secondary text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              >
                {currentBanner.buttonText || 'En savoir plus'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-accent-primary w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

