'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'

interface GameLaunchProps {
  gameId: string
  gameUrl: string
  gameTitle: string
  onClose: () => void
}

export default function GameLaunch({
  gameId,
  gameUrl,
  gameTitle,
  onClose
}: GameLaunchProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    // Track game launch
    const launchGame = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/games/${gameId}/launch`, {
        //   method: 'POST'
        // })
        // if (!response.ok) {
        //   throw new Error('Failed to launch game')
        // }
        
        // Using mock data - just simulate API call
        await new Promise(resolve => setTimeout(resolve, 200))
        console.log('Game launch tracked:', gameId)
      } catch (err) {
        console.error('Error launching game:', err)
        // Don't block the game launch if tracking fails
      }
    }

    launchGame()
  }, [gameId])

  const handleIframeLoad = () => {
    setLoading(false)
    setIframeLoaded(true)
  }

  const handleIframeError = () => {
    setLoading(false)
    setError('Failed to load game. Please try again.')
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
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-text-primary text-lg mb-2">Erreur</p>
                <p className="text-text-secondary">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {!error && (
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

