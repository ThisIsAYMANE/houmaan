'use client'

import { Gamepad2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface GameActivity {
  id: string
  game_title: string
  game_icon?: string
  player_username: string
  bet_amount: number
  currency: string
  country_flag?: string
  multiplier: number
  profit: number
  is_win: boolean
}

interface GameActivityTableProps {
  activities: GameActivity[]
  activeTab?: 'last-bet' | 'top-roll' | 'betting-contest'
  onTabChange?: (tab: 'last-bet' | 'top-roll' | 'betting-contest') => void
}

export default function GameActivityTable({
  activities,
  activeTab = 'last-bet',
  onTabChange
}: GameActivityTableProps) {
  const { t } = useI18n()
  
  const tabs = [
    { id: 'last-bet' as const, label: t('home.activityTabLastBet', 'Dernier pari') },
    { id: 'top-roll' as const, label: t('home.activityTabTopRoll', 'Rouleau Haut') },
    { id: 'betting-contest' as const, label: t('home.activityTabContest', 'Concours de paris') }
  ]

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">{t('home.activityTitle', 'Dernier tour et course')}</h2>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">{t('home.colGame', 'Jeu')}</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">{t('home.colPlayer', 'Joueur')}</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">{t('home.colBetAmount', 'Montant du pari')}</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">{t('home.colMultiplier', 'Multiplicateur')}</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">{t('home.colProfit', 'Bénéfice')}</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-text-secondary">
                  {t('home.noRecentActivity', 'Aucune activité récente')}
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
                >
                  {/* Game */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                        <Gamepad2 className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-sm text-text-primary font-medium">
                        {activity.game_title}
                      </span>
                    </div>
                  </td>

                  {/* Player */}
                  <td className="py-3 px-4">
                    <span className="text-sm text-text-secondary">{activity.player_username}</span>
                  </td>

                  {/* Bet Amount */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm text-text-primary font-medium">
                        {activity.bet_amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-text-secondary">{activity.currency}</span>
                      {activity.country_flag && (
                        <span className="text-sm">{activity.country_flag}</span>
                      )}
                    </div>
                  </td>

                  {/* Multiplier */}
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-text-primary font-medium">
                      {activity.multiplier.toFixed(2)}x
                    </span>
                  </td>

                  {/* Profit */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className={`text-sm font-bold ${
                          activity.is_win
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {activity.is_win ? '+' : '-'}
                        {Math.abs(activity.profit).toFixed(2)}
                      </span>
                      <span className="text-xs text-text-secondary">{activity.currency}</span>
                      {activity.country_flag && (
                        <span className="text-sm">{activity.country_flag}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}







interface GameActivity {
  id: string
  game_title: string
  game_icon?: string
  player_username: string
  bet_amount: number
  currency: string
  country_flag?: string
  multiplier: number
  profit: number
  is_win: boolean
}

interface GameActivityTableProps {
  activities: GameActivity[]
  activeTab?: 'last-bet' | 'top-roll' | 'betting-contest'
  onTabChange?: (tab: 'last-bet' | 'top-roll' | 'betting-contest') => void
}







