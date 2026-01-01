'use client'

import { useState, useRef, useEffect } from 'react'
import { User, ChevronDown, LogIn, UserCircle, Settings, LogOut, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import LoginModal from '@/components/auth/LoginModal'
import ProfileModal from '@/components/auth/ProfileModal'
import toast from 'react-hot-toast'

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, sessionToken, logout } = useAuthStore()

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

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
      }
      logout()
      toast.success('Déconnexion réussie')
      setIsOpen(false)
    } catch (error) {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setShowProfileModal(true)
    } else {
      setShowLoginModal(true)
    }
    setIsOpen(false)
  }

  return (
    <>
      {isAuthenticated ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 p-2 hover:bg-background-elevated rounded-md transition-colors"
          >
            <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-background-primary" />
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-background-elevated border border-background-secondary rounded-md shadow-lg py-1 z-50">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-text-primary hover:bg-background-secondary transition-colors text-left"
              >
                <UserCircle className="w-4 h-4" />
                <span>Mon profil</span>
              </button>
              <Link
                href="/wallet"
                className="flex items-center gap-3 px-4 py-2 text-text-primary hover:bg-background-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Wallet className="w-4 h-4" />
                <span>Portefeuille</span>
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
              <div className="border-t border-background-secondary my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-text-primary hover:bg-background-secondary transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-white font-semibold hover:bg-bg-tertiary transition-colors"
          >
            Se connecter
          </button>
          <Link
            href="/register"
            className="px-4 py-2 bg-green-500 rounded-lg text-black font-semibold hover:bg-green-600 transition-colors"
          >
            S'inscrire
          </Link>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {isAuthenticated && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  )
}

