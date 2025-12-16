'use client'

import { useState, useRef, useEffect } from 'react'
import { User, ChevronDown, LogIn, UserCircle, Settings } from 'lucide-react'
import Link from 'next/link'

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // For now, show login button (will be replaced with actual profile in Phase 3)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-background-elevated rounded-md transition-colors"
      >
        <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-background-primary" />
        </div>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background-elevated border border-background-secondary rounded-md shadow-lg py-1 z-50">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-2 text-text-primary hover:bg-background-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <LogIn className="w-4 h-4" />
            <span>Connexion</span>
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-3 px-4 py-2 text-text-primary hover:bg-background-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <UserCircle className="w-4 h-4" />
            <span>Inscription</span>
          </Link>
          <div className="border-t border-background-secondary my-1"></div>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2 text-text-primary hover:bg-background-secondary transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </Link>
        </div>
      )}
    </div>
  )
}

