'use client'

import { useState } from 'react'
import { ShoppingCart, Zap, HelpCircle } from 'lucide-react'

interface FloatingActionBarProps {
  betCount?: number
  onBetSlipClick?: () => void
  onSupportClick?: () => void
}

export default function FloatingActionBar({
  betCount = 0,
  onBetSlipClick,
  onSupportClick
}: FloatingActionBarProps) {
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Bet Slip Button */}
      <button
        onClick={onBetSlipClick}
        className="relative px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-all flex items-center gap-2 font-semibold"
        title="Coupon"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Coupon</span>
        {betCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {betCount > 9 ? '9+' : betCount}
          </span>
        )}
      </button>

      {/* Flash Bet Toggle */}
      <button
        onClick={() => setFlashBetEnabled(!flashBetEnabled)}
        className={`px-4 py-3 rounded-lg shadow-lg transition-all flex items-center gap-2 font-semibold ${
          flashBetEnabled
            ? 'bg-green-500 text-white'
            : 'bg-bg-secondary text-text-primary border border-border-primary hover:bg-bg-tertiary'
        }`}
        title="Pari éclair"
      >
        <Zap className="w-5 h-5" />
        <span>PARI ÉCLAIR</span>
      </button>

      {/* Support Button */}
      <button
        onClick={onSupportClick}
        className="p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all"
        title="Support"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </div>
  )
}


import { useState } from 'react'
import { ShoppingCart, Zap, HelpCircle } from 'lucide-react'

interface FloatingActionBarProps {
  betCount?: number
  onBetSlipClick?: () => void
  onSupportClick?: () => void
}

export default function FloatingActionBar({
  betCount = 0,
  onBetSlipClick,
  onSupportClick
}: FloatingActionBarProps) {
  const [flashBetEnabled, setFlashBetEnabled] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Bet Slip Button */}
      <button
        onClick={onBetSlipClick}
        className="relative px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-all flex items-center gap-2 font-semibold"
        title="Coupon"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Coupon</span>
        {betCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {betCount > 9 ? '9+' : betCount}
          </span>
        )}
      </button>

      {/* Flash Bet Toggle */}
      <button
        onClick={() => setFlashBetEnabled(!flashBetEnabled)}
        className={`px-4 py-3 rounded-lg shadow-lg transition-all flex items-center gap-2 font-semibold ${
          flashBetEnabled
            ? 'bg-green-500 text-white'
            : 'bg-bg-secondary text-text-primary border border-border-primary hover:bg-bg-tertiary'
        }`}
        title="Pari éclair"
      >
        <Zap className="w-5 h-5" />
        <span>PARI ÉCLAIR</span>
      </button>

      {/* Support Button */}
      <button
        onClick={onSupportClick}
        className="p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all"
        title="Support"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </div>
  )
}

