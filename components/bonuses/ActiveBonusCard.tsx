'use client'

import { Clock, Trophy, Gift, Zap, ChevronRight, X } from 'lucide-react'
import BonusProgressBar from './BonusProgressBar'

export interface BonusData {
  id: string
  type: 'welcome' | 'cashback' | 'bet_and_get'
  bonusAmount: number
  wageringRequirement: number
  wageringProgress: number
  progressPct: number
  maxBetLimit: number | null
  expiresAt: string
}

interface ActiveBonusCardProps {
  bonus: BonusData
  onForfeit?: (bonusId: string) => void
  compact?: boolean
}

const BONUS_CONFIG = {
  welcome: {
    icon: Trophy,
    label: 'Bonus de Bienvenue',
    color: 'from-yellow-500 to-amber-600',
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
  },
  cashback: {
    icon: Zap,
    label: 'Cashback Hebdomadaire',
    color: 'from-blue-500 to-cyan-600',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
  },
  bet_and_get: {
    icon: Gift,
    label: 'Pari Offert',
    color: 'from-purple-500 to-pink-600',
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
  },
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expiré'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}j ${hours % 24}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export default function ActiveBonusCard({ bonus, onForfeit, compact = false }: ActiveBonusCardProps) {
  const config = BONUS_CONFIG[bonus.type]
  const Icon = config.icon
  const timeLeft = formatTimeLeft(bonus.expiresAt)
  const isExpiringSoon = new Date(bonus.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor}`}>
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate">{config.label}</p>
          <BonusProgressBar progress={bonus.progressPct} compact />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold text-text-primary">{bonus.progressPct}%</p>
          <p className={`text-xs ${isExpiringSoon ? 'text-red-400' : 'text-text-secondary'}`}>{timeLeft}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${config.bgColor}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{config.label}</p>
            <p className="text-white/80 text-xs">${bonus.bonusAmount.toFixed(2)} crédités</p>
          </div>
        </div>
        {onForfeit && (
          <button
            onClick={() => onForfeit(bonus.id)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            title="Abandonner le bonus"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Wagering Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-text-secondary">Progression mise</span>
            <span className="text-xs font-semibold text-text-primary">
              ${bonus.wageringProgress.toFixed(2)} / ${bonus.wageringRequirement.toFixed(2)}
            </span>
          </div>
          <BonusProgressBar progress={bonus.progressPct} />
          <p className="text-xs text-text-secondary mt-1">{bonus.progressPct}% complété</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {bonus.maxBetLimit !== null && (
            <div className="bg-background-elevated/50 rounded-lg p-2.5">
              <p className="text-xs text-text-secondary">Mise max</p>
              <p className="text-sm font-semibold text-text-primary">${bonus.maxBetLimit.toFixed(2)}</p>
            </div>
          )}
          <div className={`bg-background-elevated/50 rounded-lg p-2.5 ${isExpiringSoon ? 'border border-red-500/50' : ''}`}>
            <div className="flex items-center gap-1">
              <Clock className={`w-3 h-3 ${isExpiringSoon ? 'text-red-400' : 'text-text-secondary'}`} />
              <p className="text-xs text-text-secondary">Expire dans</p>
            </div>
            <p className={`text-sm font-semibold ${isExpiringSoon ? 'text-red-400' : 'text-text-primary'}`}>
              {timeLeft}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
