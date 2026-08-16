'use client'

import { useEffect, useState } from 'react'
import { Zap, X, ChevronRight } from 'lucide-react'

interface CashbackNotificationProps {
  amount: number
  wageringRequirement: number
  expiresInHours: number
  onClose?: () => void
  onViewBonus?: () => void
}

export default function CashbackNotification({
  amount,
  wageringRequirement,
  expiresInHours,
  onClose,
  onViewBonus,
}: CashbackNotificationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in after a short delay
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-4 shadow-2xl shadow-blue-500/30 border border-blue-400/30">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Cashback hebdomadaire reçu !</p>
            <p className="text-white/90 text-lg font-black mt-0.5">
              ${amount.toFixed(2)} <span className="text-sm font-normal text-white/70">crédités</span>
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-white/70">
              <span>Mise : {wageringRequirement.toFixed(2)}× (5×)</span>
              <span>•</span>
              <span>Expire dans {expiresInHours}h</span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* CTA */}
        {onViewBonus && (
          <button
            onClick={() => { onViewBonus(); handleClose() }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold"
          >
            Voir mon bonus <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
