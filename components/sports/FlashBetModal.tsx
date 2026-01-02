'use client'

import { X, Check, Zap, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FlashBetModalProps {
  isOpen: boolean
  betAmount: number
  onClose: () => void
  onBetAmountChange: (amount: number) => void
}

export default function FlashBetModal({
  isOpen,
  betAmount,
  onClose,
  onBetAmountChange
}: FlashBetModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const quickBetAmounts = [1, 10, 50, 100]

  const handleMyBetsClick = () => {
    router.push('/sports/my-bets')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[110] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="bg-bg-secondary rounded-lg border border-border-primary w-full max-w-md overflow-hidden">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-black font-semibold">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-black rounded"></div>
              </div>
              <span>Coupon</span>
              <X className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-black font-semibold">PARI ÉCLAIR</span>
              <div className="relative w-12 h-6 rounded-full bg-white">
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informational Text */}
            <div className="space-y-2">
              <p className="text-white text-sm leading-relaxed">
                Le mode Pari éclair est activé ! Vos paris seront placés immédiatement après un seul clic, peu importe la sélection. Consultez vos paris sur la{' '}
                <button
                  onClick={handleMyBetsClick}
                  className="underline inline-flex items-center gap-1 text-white hover:text-green-500 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  page Mes paris
                </button>
              </p>
            </div>

            {/* Quick Bet Amount Buttons */}
            <div className="flex gap-3">
              {quickBetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onBetAmountChange(amount)}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    betAmount === amount
                      ? 'bg-green-500 text-white'
                      : 'bg-bg-tertiary text-white hover:bg-bg-primary'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Bet Amount Input */}
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => onBetAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-black rounded-lg text-white text-lg font-semibold pr-12"
                min="0"
                step="0.01"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-white font-semibold">$</span>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="flex items-center gap-2 pt-4 border-t border-border-primary">
              <Zap className="w-5 h-5 text-purple-500" />
              <p className="text-white text-sm">
                Pari éclair est activé avec une mise de {betAmount} $
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
