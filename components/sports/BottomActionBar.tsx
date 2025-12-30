'use client'

import { Menu, Zap, ChevronUp } from 'lucide-react'

interface BottomActionBarProps {
  betCount: number
  flashBetEnabled: boolean
  onBetSlipClick: () => void
  onFlashBetToggle: (enabled: boolean) => void
}

export default function BottomActionBar({
  betCount,
  flashBetEnabled,
  onBetSlipClick,
  onFlashBetToggle
}: BottomActionBarProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[90] bg-green-500 rounded-lg px-4 py-3 flex items-center gap-4 shadow-lg">
      {/* Coupon Button */}
      <button
        onClick={onBetSlipClick}
        className="flex items-center gap-2 text-black font-semibold"
      >
        <Menu className="w-5 h-5" />
        <span>Coupon</span>
        {betCount > 0 && (
          <span className="w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center border border-white">
            {betCount > 9 ? '9+' : betCount}
          </span>
        )}
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Flash Bet Toggle */}
      <div className="flex items-center gap-3 border-l border-black/20 pl-4">
        <span className="text-black font-semibold">PARI ÉCLAIR</span>
        <button
          onClick={() => onFlashBetToggle(!flashBetEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors border-2 border-black ${
            flashBetEnabled ? 'bg-green-500' : 'bg-black/20'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform flex items-center justify-center ${
              flashBetEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            <Zap className="w-3 h-3 text-white" />
          </div>
        </button>
      </div>
    </div>
  )
}


import { Menu, Zap, ChevronUp } from 'lucide-react'

interface BottomActionBarProps {
  betCount: number
  flashBetEnabled: boolean
  onBetSlipClick: () => void
  onFlashBetToggle: (enabled: boolean) => void
}

export default function BottomActionBar({
  betCount,
  flashBetEnabled,
  onBetSlipClick,
  onFlashBetToggle
}: BottomActionBarProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[90] bg-green-500 rounded-lg px-4 py-3 flex items-center gap-4 shadow-lg">
      {/* Coupon Button */}
      <button
        onClick={onBetSlipClick}
        className="flex items-center gap-2 text-black font-semibold"
      >
        <Menu className="w-5 h-5" />
        <span>Coupon</span>
        {betCount > 0 && (
          <span className="w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center border border-white">
            {betCount > 9 ? '9+' : betCount}
          </span>
        )}
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Flash Bet Toggle */}
      <div className="flex items-center gap-3 border-l border-black/20 pl-4">
        <span className="text-black font-semibold">PARI ÉCLAIR</span>
        <button
          onClick={() => onFlashBetToggle(!flashBetEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors border-2 border-black ${
            flashBetEnabled ? 'bg-green-500' : 'bg-black/20'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform flex items-center justify-center ${
              flashBetEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            <Zap className="w-3 h-3 text-white" />
          </div>
        </button>
      </div>
    </div>
  )
}

