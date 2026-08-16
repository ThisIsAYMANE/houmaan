'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const POPUP_BANNER_KEY = 'houman_popup_banner_shown'

/**
 * PopupBanner — Shows once per session on first visit.
 * Uses the popup banner image from public/banners/popup banner.png
 */
export default function PopupBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only show once per session
    const alreadyShown = sessionStorage.getItem(POPUP_BANNER_KEY)
    if (!alreadyShown) {
      // Delay slightly so the page loads first
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem(POPUP_BANNER_KEY, 'true')
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose()
  }

  if (!isVisible) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="relative max-w-lg w-[90vw] mx-auto animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-bg-secondary border border-border-primary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors shadow-lg"
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner image */}
        <img
          src="/banners/popup banner.png"
          alt="Welcome bonus"
          className="w-full h-auto rounded-xl shadow-2xl"
          draggable={false}
        />
      </div>
    </div>
  )
}
