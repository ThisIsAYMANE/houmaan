'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface AdBannerProps {
  title?: string
  description?: string
  buttonText?: string
  linkUrl?: string
  imageUrl?: string
  onClose?: () => void
  dismissible?: boolean
}

export default function AdBanner({
  title = '🎁 Bonus de bienvenue jusqu\'à 100%',
  description = 'Rejoignez-nous maintenant et obtenez un bonus de bienvenue exclusif!',
  buttonText = 'Découvrir',
  linkUrl = '/promotions',
  imageUrl,
  onClose,
  dismissible = true
}: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div className="relative w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-lg overflow-hidden mb-6 border border-purple-500/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative px-6 py-4 flex items-center justify-between gap-4">
        {/* Content */}
        <div className="flex items-center gap-4 flex-1">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Advertisement" 
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
            <p className="text-white/90 text-sm">{description}</p>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={linkUrl}
          className="px-6 py-2.5 bg-white text-purple-700 font-semibold rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          {buttonText}
        </Link>

        {/* Close Button */}
        {dismissible && (
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close advertisement"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  )
}






import { X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface AdBannerProps {
  title?: string
  description?: string
  buttonText?: string
  linkUrl?: string
  imageUrl?: string
  onClose?: () => void
  dismissible?: boolean
}

export default function AdBanner({
  title = '🎁 Bonus de bienvenue jusqu\'à 100%',
  description = 'Rejoignez-nous maintenant et obtenez un bonus de bienvenue exclusif!',
  buttonText = 'Découvrir',
  linkUrl = '/promotions',
  imageUrl,
  onClose,
  dismissible = true
}: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div className="relative w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-lg overflow-hidden mb-6 border border-purple-500/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative px-6 py-4 flex items-center justify-between gap-4">
        {/* Content */}
        <div className="flex items-center gap-4 flex-1">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Advertisement" 
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
            <p className="text-white/90 text-sm">{description}</p>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={linkUrl}
          className="px-6 py-2.5 bg-white text-purple-700 font-semibold rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          {buttonText}
        </Link>

        {/* Close Button */}
        {dismissible && (
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close advertisement"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  )
}






