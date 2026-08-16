'use client'

import { useState } from 'react'
import { X, Trophy, Gift, Star, ChevronRight, AlertTriangle } from 'lucide-react'

interface WelcomeBonusModalProps {
  isOpen: boolean
  onClose: () => void
  bonusAmount: number
  wageringRequirement: number
  freeSpins: number
  maxBetLimit: number
  expiresAt: string
  onStartPlaying?: () => void
}

export default function WelcomeBonusModal({
  isOpen,
  onClose,
  bonusAmount,
  wageringRequirement,
  freeSpins,
  maxBetLimit,
  expiresAt,
  onStartPlaying,
}: WelcomeBonusModalProps) {
  const [step, setStep] = useState(0)
  if (!isOpen) return null

  const expiryDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const steps = [
    {
      icon: <Trophy className="w-10 h-10 text-yellow-400" />,
      title: `$${bonusAmount.toFixed(2)} crédités !`,
      subtitle: 'Bonus de Bienvenue activé',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">${bonusAmount.toFixed(2)}</p>
              <p className="text-xs text-text-secondary mt-1">Bonus crédité</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{freeSpins}</p>
              <p className="text-xs text-text-secondary mt-1">Tours gratuits</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary text-center">
            Vos tours gratuits sont disponibles — 10 par jour pendant 5 jours.
          </p>
        </div>
      ),
    },
    {
      icon: <Star className="w-10 h-10 text-blue-400" />,
      title: 'Règles de mise',
      subtitle: 'Complétez pour retirer vos gains',
      content: (
        <div className="space-y-3">
          {[
            { label: 'Mise requise', value: `${35}× le bonus = $${wageringRequirement.toFixed(2)}`, ok: true },
            { label: 'Jeux éligibles', value: 'Machines à sous — 100% contribution', ok: true },
            { label: 'Jeux exclus', value: 'Blackjack, Roulette, Poker — 0%', ok: false },
            { label: 'Expire le', value: expiryDate, ok: true },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-background-elevated rounded-lg">
              <span className={`text-sm mt-0.5 font-bold ${item.ok ? 'text-green-400' : 'text-red-400'}`}>
                {item.ok ? '✓' : '✗'}
              </span>
              <div>
                <p className="text-xs text-text-secondary">{item.label}</p>
                <p className="text-sm font-medium text-text-primary">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <AlertTriangle className="w-10 h-10 text-orange-400" />,
      title: 'Limite de mise',
      subtitle: 'Important — lisez attentivement',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <p className="text-4xl font-bold text-orange-400 text-center">${maxBetLimit.toFixed(2)}</p>
            <p className="text-sm text-text-secondary text-center mt-1">Mise maximale par tour</p>
          </div>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>⚠️ Toute mise dépassant ${maxBetLimit.toFixed(2)} pendant la durée du bonus est <strong className="text-red-400">interdite</strong>.</p>
            <p>⚠️ Les gains issus de mises supérieures seront <strong className="text-red-400">annulés</strong>.</p>
            <p>✓ Cette limite s'applique uniquement pendant la durée du bonus.</p>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background-secondary rounded-2xl shadow-2xl border border-background-elevated overflow-hidden">
        {/* Animated gradient header */}
        <div className="relative bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500 p-6 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent)]" />
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex justify-center mb-3">{current.icon}</div>
          <h2 className="text-xl font-bold text-white">{current.title}</h2>
          <p className="text-white/80 text-sm mt-1">{current.subtitle}</p>
          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-white w-6' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{current.content}</div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 px-4 py-3 rounded-xl border border-border-primary text-text-primary font-semibold hover:bg-background-elevated transition-colors"
            >
              Retour
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) { onClose(); onStartPlaying?.() }
              else setStep(s => s + 1)
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isLast ? (
              <><Gift className="w-4 h-4" /> Commencer à jouer</>
            ) : (
              <>Suivant <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
