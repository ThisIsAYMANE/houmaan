'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryTabsProps {
  categories: Category[]
  activeCategory?: string
  onCategoryChange?: (slug: string) => void
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange
}: CategoryTabsProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    updateScrollButtons()
  }, [categories])

  const updateScrollButtons = () => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = 200
    const newScrollLeft =
      scrollRef.current.scrollLeft +
      (direction === 'left' ? -scrollAmount : scrollAmount)

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })

    setTimeout(updateScrollButtons, 100)
  }

  return (
    <div className="relative mb-8">
      <div className="flex items-center gap-2">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex-shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </button>
        )}

        {/* Tabs */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-1 overflow-x-auto scrollbar-hide flex-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.slug || (!activeCategory && category.slug === 'lobby')
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange?.(category.slug)}
                className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                {category.name}
              </button>
            )
          })}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex-shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-text-primary" />
          </button>
        )}
      </div>
    </div>
  )
}






