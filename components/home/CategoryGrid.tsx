'use client'

import Link from 'next/link'
import { 
  Dice6, 
  Trophy, 
  Coins, 
  Ticket, 
  TrendingUp, 
  Gamepad2,
  Target
} from 'lucide-react'

interface CategoryCard {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description?: string
  bgColor: 'green' | 'purple' | 'gray'
  graphic: string
}

const categories: CategoryCard[] = [
  {
    id: 'casino',
    title: 'CASINO',
    icon: Dice6,
    href: '/casino',
    description: 'Plongez dans nos jeux internes, notre casino en direct et nos machines à sous',
    bgColor: 'green',
    graphic: '🎰'
  },
  {
    id: 'sports',
    title: 'SPORTS',
    icon: Trophy,
    href: '/sports',
    description: 'Pariez sur le football, le cricket, la NFL, l\'eSport et plus de 80 sports !',
    bgColor: 'purple',
    graphic: '⚽'
  },
  {
    id: 'poker',
    title: 'POKER',
    icon: Dice6,
    href: '/poker',
    bgColor: 'green',
    graphic: '🃏'
  },
  {
    id: 'course',
    title: 'COURSE',
    icon: Target,
    href: '/course',
    bgColor: 'gray',
    graphic: '🐎'
  },
  {
    id: 'loterie',
    title: 'LOTERIE',
    icon: Ticket,
    href: '/lottery',
    bgColor: 'green',
    graphic: '🎫'
  },
  {
    id: 'haut-bas',
    title: 'HAUT BAS',
    icon: TrendingUp,
    href: '/haut-bas',
    bgColor: 'green',
    graphic: '📈'
  },
  {
    id: 'bingo',
    title: 'BINGO',
    icon: Gamepad2,
    href: '/bingo',
    bgColor: 'purple',
    graphic: '🎱'
  }
]

export default function CategoryGrid() {
  const getBgColor = (color: 'green' | 'purple' | 'gray') => {
    switch (color) {
      case 'green':
        return 'bg-gradient-to-br from-green-900 via-green-800 to-green-900'
      case 'purple':
        return 'bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900'
      case 'gray':
        return 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800'
    }
  }

  // Separate primary (large) and secondary (small) categories
  const primaryCategories = categories.filter(cat => cat.id === 'casino' || cat.id === 'sports')
  const secondaryCategories = categories.filter(cat => cat.id !== 'casino' && cat.id !== 'sports')

  return (
    <div className="mb-8 space-y-4">
      {/* Row 1: Primary Categories - 2 Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {primaryCategories.map((category) => {
          const IconComponent = category.icon
          
          return (
            <Link
              key={category.id}
              href={category.href}
              className={`group relative ${getBgColor(category.bgColor)} rounded-lg p-8 overflow-hidden border border-border-primary hover:border-accent-primary transition-all duration-200 hover:shadow-lg hover:shadow-accent-primary/20 min-h-[200px]`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
              </div>

              {/* Content - Horizontal Layout */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Left Side - Text Content */}
                <div className="flex-1">
                  {/* Title with Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent-primary/20">
                      <IconComponent className="w-6 h-6 text-accent-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                  </div>

                  {/* Description */}
                  {category.description && (
                    <p className="text-white/80 text-sm leading-relaxed max-w-md">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Right Side - Graphic */}
                <div className="flex items-center justify-end mt-4">
                  <div className="text-7xl group-hover:scale-110 transition-transform duration-200">
                    {category.graphic}
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-accent-primary/0 group-hover:bg-accent-primary/10 transition-colors duration-200" />
            </Link>
          )
        })}
      </div>

      {/* Row 2: Secondary Categories - 5 Smaller Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {secondaryCategories.map((category) => {
          const IconComponent = category.icon
          
          return (
            <Link
              key={category.id}
              href={category.href}
              className={`group relative ${getBgColor(category.bgColor)} rounded-lg p-4 overflow-hidden border border-border-primary hover:border-accent-primary transition-all duration-200 hover:shadow-lg hover:shadow-accent-primary/20 h-[100px] flex flex-col items-center justify-center`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
              </div>

              {/* Content - Centered Layout */}
              <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
                {/* Icon */}
                <div className="mb-1 flex justify-center">
                  <div className="p-1 rounded bg-accent-primary/20">
                    <IconComponent className="w-4 h-4 text-accent-primary" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white mb-1">{category.title}</h3>

                {/* Graphic */}
                <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  {category.graphic}
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-accent-primary/0 group-hover:bg-accent-primary/10 transition-colors duration-200" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
