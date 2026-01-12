'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

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
  const { isAuthenticated, sessionToken } = useAuthStore()

  // Launch game function (memoized with useCallback)
  const launchGame = useCallback(async () => {
    if (!sessionToken) {
      // Redirect to login page with return URL
      // Use window.location to ensure full page redirect
      const returnUrl = `/casino?game=${gameId}`
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`
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
        // Handle different error response formats
        // Check for detailed error message from server
        const errorMessage = errorData.message || 
                           errorData.error?.message || 
                           errorData.error || 
                           errorData.message || 
                           `Failed to launch game (${response.status})`
        
        // Log full error for debugging
        console.error('Game launch error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
          // Include stack trace in development
          ...(process.env.NODE_ENV === 'development' && errorData.stack && { stack: errorData.stack })
        })
        
        // If authentication error, redirect to login
        if (response.status === 401 || 
            errorMessage.includes('Authentication') || 
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('authenticated')) {
          const returnUrl = `/casino?game=${gameId}`
          window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`
          return
        }
        
        // Handle provider/currency errors with user-friendly messages
        if (errorMessage.includes('provider is not enabled') || 
            errorMessage.includes('currency is not enabled')) {
          throw new Error('Ce jeu n\'est pas disponible actuellement. Veuillez essayer un autre jeu.')
        }
        
        // Show detailed error message to user
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (!data.gameUrl || data.gameUrl === '#') {
        throw new Error('No game URL returned from server')
      }
      
      // Set the game URL from Slotegrator
      setGameUrl(data.gameUrl)
      setLoading(false) // Stop loading when we have the URL
      console.log('Game launched successfully:', gameId, data.gameUrl)
    } catch (err) {
      console.error('Error launching game:', err)
      // Don't set error if we're redirecting (error will be null)
      if (err instanceof Error && !err.message.includes('redirect')) {
        setError(err.message)
      }
      setLoading(false)
    }
  }, [gameId, sessionToken])

  useEffect(() => {
    // Check if user is authenticated first
    if (!isAuthenticated || !sessionToken) {
      // Redirect to login page with return URL
      // Use window.location to ensure full page redirect and prevent component re-render issues
      const returnUrl = `/casino?game=${gameId}`
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      return
    }

    // User is authenticated, launch the game
    launchGame()
  }, [gameId, isAuthenticated, sessionToken, launchGame])

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
                <Loader2 className="w-12 h-12 text-accent-primary animate-spin mx-auto mb-4" />
                <p className="text-text-primary text-lg mb-2">Redirection...</p>
                <p className="text-text-secondary">
                  {error}
                </p>
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
    </div>
  )
}
