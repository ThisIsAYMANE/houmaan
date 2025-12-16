'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Dice6,
  Trophy,
  Gift,
  Ticket,
  TrendingUp,
  Crown,
  Star,
  Users,
  HelpCircle,
  BookOpen,
  Info,
  ChevronRight,
  X,
  Heart,
  Clock,
  Sparkles,
  Sliders,
  Tv,
  Cards,
  Gamepad2,
  Target,
} from 'lucide-react'
import BCJetonCard from './BCJetonCard'

interface SidebarProps {
  isOpen: boolean
  isCollapsed?: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  items?: NavItem[]
}

interface NavSection {
  title?: string
  items: NavItem[]
  expandable?: boolean
  isMainNav?: boolean
}

const navigation: NavSection[] = [
  {
    isMainNav: true,
    items: [
      {
        label: 'Casino',
        href: '/casino',
        icon: Dice6,
        items: [
          { label: 'Favoris', href: '/casino/favorites' },
          { label: 'Récent', href: '/casino/recent' },
          { label: 'BC Originaux', href: '/casino/bc-originaux' },
          { label: 'BC Exclusif', href: '/casino/bc-exclusif' },
          { label: 'Jeux populaires', href: '/casino/popular' },
          { label: 'Machines à sous', href: '/casino/slots' },
          { label: 'Casino en direct', href: '/casino/live' },
          { label: 'Fonctionnalité Buy-in', href: '/casino/buy-in' },
          { label: 'Nouveautés', href: '/casino/new' },
          { label: 'Jeux Burst', href: '/casino/burst' },
          { label: 'Poker', href: '/casino/poker' },
          { label: 'Bingo', href: '/casino/bingo' },
          { label: 'Jeux de table', href: '/casino/table-games' },
          { label: 'Blackjack', href: '/casino/blackjack' },
          { label: 'Roulette', href: '/casino/roulette' },
          { label: 'Bac', href: '/casino/baccarat' },
        ],
      },
      {
        label: 'Sports',
        href: '/sports',
        icon: Trophy,
        items: [
          { label: 'Football', href: '/sports/football' },
          { label: 'Basketball', href: '/sports/basketball' },
          { label: 'Tennis', href: '/sports/tennis' },
          { label: 'eFootball', href: '/sports/efootball' },
          { label: 'Tous les sports', href: '/sports' },
        ],
      },
      { label: 'Anniversaire', href: '/anniversary', icon: Gift, badge: 'New +' },
      { label: 'Loterie', href: '/lottery', icon: Ticket },
      { label: 'Contrats à terme', href: '/futures', icon: TrendingUp },
      { label: 'Promotions', href: '/promotions', icon: Gift },
    ],
  },
  {
    title: 'VIP Club',
    items: [
      { label: 'VIP Club', href: '/vip', icon: Crown },
      { label: 'Bonus', href: '/bonuses', icon: Gift, badge: '+180%' },
      { label: 'Centre de quêtes', href: '/quests', icon: Star },
      { label: 'Parrainage', href: '/referrals', icon: Users },
      { label: 'Forum', href: '/forum', icon: Users },
    ],
  },
  {
    title: 'Info',
    items: [
      { label: 'Jeux prouvé-équitable', href: '/provably-fair', icon: HelpCircle },
      { label: 'Responsable Jeu d\'argent', href: '/responsible-gaming', icon: Info },
      { label: 'Blog', href: '/blog', icon: BookOpen },
      { label: 'Informations sur les paris', href: '/betting-info', icon: Info },
    ],
  },
]

export default function Sidebar({ isOpen, isCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const toggleItem = (itemHref: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemHref)) {
      newExpanded.delete(itemHref)
    } else {
      newExpanded.add(itemHref)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 bg-background-secondary border-r border-background-elevated z-40
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          width: isCollapsed ? '5rem' : '16rem', // 80px : 256px
          willChange: 'width',
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-background-elevated flex-shrink-0">
            <span className="text-text-primary font-semibold">Menu</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-elevated rounded-md"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>

          {/* BC Jeton Card */}
          <div 
            className={`p-4 border-b border-background-elevated flex-shrink-0 transition-all duration-300 overflow-hidden ${
              isCollapsed ? 'opacity-0 max-h-0 p-0 border-0' : 'opacity-100 max-h-32'
            }`}
          >
            <BCJetonCard />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navigation.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                {section.title && (
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-text-secondary text-sm font-medium hover:text-text-primary transition-all duration-300 overflow-hidden ${
                      isCollapsed ? 'opacity-0 max-h-0 p-0' : 'opacity-100 max-h-12'
                    }`}
                  >
                    <span>{section.title}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        expandedSections.has(sectionIndex) ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                )}

                {(section.title ? expandedSections.has(sectionIndex) : true) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      const hasSubItems = item.items && item.items.length > 0
                      const isExpanded = expandedItems.has(item.href)

                      return (
                        <div key={item.href}>
                          <div className="flex items-center">
                            {hasSubItems ? (
                              <button
                                onClick={() => toggleItem(item.href)}
                                className={`
                                  flex-1 flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-all duration-300
                                  ${isCollapsed ? 'justify-center px-2' : ''}
                                  ${
                                    isActive
                                      ? 'bg-accent-primary text-background-primary'
                                      : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                                  }
                                `}
                                title={isCollapsed ? item.label : undefined}
                              >
                                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                                <span 
                                  className={`flex-1 text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${
                                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span 
                                    className={`px-2 py-0.5 bg-accent-primary text-background-primary text-xs font-semibold rounded transition-all duration-300 overflow-hidden whitespace-nowrap ${
                                      isCollapsed ? 'opacity-0 w-0 p-0' : 'opacity-100 w-auto'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                                <ChevronRight
                                  className={`w-4 h-4 transition-all duration-300 flex-shrink-0 ${
                                    isExpanded ? 'rotate-90' : ''
                                  } ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}
                                />
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={`
                                  flex-1 flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-all duration-300
                                  ${isCollapsed ? 'justify-center px-2' : ''}
                                  ${
                                    isActive
                                      ? 'bg-accent-primary text-background-primary'
                                      : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                                  }
                                `}
                                title={isCollapsed ? item.label : undefined}
                              >
                                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                                <span 
                                  className={`flex-1 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span 
                                    className={`px-2 py-0.5 bg-accent-primary text-background-primary text-xs font-semibold rounded transition-all duration-300 overflow-hidden whitespace-nowrap ${
                                      isCollapsed ? 'opacity-0 w-0 p-0' : 'opacity-100 w-auto'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            )}
                          </div>

                          {/* Sub-items - Only show when not collapsed */}
                          {hasSubItems && isExpanded && (
                            <div 
                              className={`ml-4 mt-1 space-y-1 transition-all duration-300 overflow-hidden ${
                                isCollapsed ? 'opacity-0 max-h-0' : 'opacity-100 max-h-96'
                              }`}
                            >
                              {item.items!.map((subItem) => {
                                const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                                return (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    onClick={onClose}
                                    className={`
                                      flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-colors text-sm
                                      ${
                                        isSubActive
                                          ? 'bg-accent-primary/20 text-accent-primary'
                                          : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                                      }
                                    `}
                                  >
                                    <span className="flex-1">{subItem.label}</span>
                                    {subItem.badge && (
                                      <span className="px-2 py-0.5 bg-accent-primary text-background-primary text-xs font-semibold rounded">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

