'use client'

import { Menu, Search, Gift, MessageCircle, Bell, User } from 'lucide-react'
import Link from 'next/link'
import BCJetonCard from './BCJetonCard'
import ProfileDropdown from './ProfileDropdown'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background-secondary border-b border-background-elevated">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-background-elevated rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-text-primary" />
            </button>
            
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-accent-primary">
                BC.GAME
              </span>
            </Link>
          </div>

          {/* Center Section */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl mx-8">
            <BCJetonCard />
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Rechercher des jeux..."
                className="w-full pl-10 pr-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            
            <select className="px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary focus:outline-none focus:border-accent-primary">
              <option value="MAD">MAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            
            <button className="px-4 py-2 bg-accent-primary text-background-primary rounded-md font-medium hover:bg-accent-primary/90 transition-colors">
              Dépôt
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-background-elevated rounded-md relative">
              <Gift className="w-5 h-5 text-text-primary" />
            </button>
            
            <button className="p-2 hover:bg-background-elevated rounded-md relative">
              <MessageCircle className="w-5 h-5 text-text-primary" />
            </button>
            
            <button className="p-2 hover:bg-background-elevated rounded-md relative">
              <Bell className="w-5 h-5 text-text-primary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-secondary rounded-full"></span>
            </button>
            
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}



