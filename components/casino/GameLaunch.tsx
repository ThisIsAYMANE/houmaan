'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, AlertCircle, LogIn } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import LoginModal from '@/components/auth/LoginModal'

interface GameLaunchProps {
  gameId: string
  gameTitle: string
  onClose: () => void
}

export default function GameLaunch({
  gameId,
  gameTitle,
  onClose
}: GameLaunchProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [gameUrl, setGameUrl] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isAuthenticated, sessionToken } = useAuthStore()

  // Launch game function (memoized with useCallback)
  const launchGame = useCallback(async () => {
    if (!sessionToken) {
      setError('Authentication required')
      setLoading(false)
      setShowLoginModal(true)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Call launch API to initialize game session with Slotegrator
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      }
      
      const response = await fetch(`/api/games/${gameId}/launch`, {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for session (fallback)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to launch game'
        
        // If authentication error, show login modal
        if (response.status === 401 || errorMessage.includes('Authentication')) {
          setShowLoginModal(true)
          throw new Error('Vous devez être connecté pour jouer')
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (!data.gameUrl || data.gameUrl === '#') {
        throw new Error('No game URL returned from server')
      }
      
      // Set the game URL from Slotegrator
      setGameUrl(data.gameUrl)
      console.log('Game launched successfully:', gameId, data.gameUrl)
    } catch (err) {
      console.error('Error launching game:', err)
      setError(err instanceof Error ? err.message : 'Failed to launch game')
      setLoading(false)
    }
  }, [gameId, sessionToken])

  useEffect(() => {
    // Check if user is authenticated first
    if (!isAuthenticated || !sessionToken) {
      setError('Authentication required')
      setLoading(false)
      setShowLoginModal(true)
      return
    }

    // User is authenticated, launch the game
    launchGame()
  }, [gameId, isAuthenticated, sessionToken, launchGame])

  // Watch for authentication changes (when user logs in)
  useEffect(() => {
    // If user just logged in and we have an error, retry launching
    if (isAuthenticated && sessionToken && error && (error.includes('Authentication') || error.includes('connecté'))) {
      setError(null)
      setShowLoginModal(false)
      launchGame()
    }
  }, [isAuthenticated, sessionToken, error, launchGame])

  const handleIframeLoad = () => {
    setLoading(false)
    setIframeLoaded(true)
  }

  const handleIframeError = () => {
    setLoading(false)
    setError('Failed to load game. Please try again.')
  }

  // Don't render iframe until we have the game URL
  if (!gameUrl && !error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-text-primary text-lg">Initialisation du jeu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-bg-secondary hover:bg-bg-tertiary rounded-full border border-border-primary transition-colors"
        aria-label="Close game"
      >
        <X className="w-5 h-5 text-text-primary" />
      </button>

      {/* Game Container */}
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-bg-secondary border-b border-border-primary px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">{gameTitle}</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-primary rounded-lg text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 relative">
          {loading && !iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-accent-primary animate-spin mx-auto mb-4" />
                <p className="text-text-primary text-lg">Chargement du jeu...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
              <div className="text-center max-w-md px-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-text-primary text-lg mb-2">Connexion requise</p>
                <p className="text-text-secondary mb-6">
                  {error.includes('connecté') || error.includes('Authentication') 
                    ? 'Vous devez être connecté pour jouer à ce jeu.'
                    : error}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-primary transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          {!error && gameUrl && (
            <iframe
              src={gameUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="fullscreen; autoplay; encrypted-media"
              title={gameTitle}
            />
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false)
            // If user successfully logs in, the component will re-render and try to launch again
            if (isAuthenticated && sessionToken) {
              setError(null)
              setLoading(true)
            }
          }}
        />
      )}
    </div>
  )
}
