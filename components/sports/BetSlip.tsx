'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Settings, TrendingUp, TrendingDown, ChevronUp, Menu, Zap, ChevronDown, Check, FileText } from 'lucide-react'

interface Bet {
  id: string
  matchId: string
  homeTeam: string
  awayTeam: string
  selection: string
  marketType?: string
  odds: number
  amount: number
  isLive?: boolean
  change?: 'up' | 'down' | 'same'
}

interface BetSlipProps {
  isOpen: boolean
  bets: Bet[]
  onClose: () => void
  onRemoveBet?: (betId: string) => void
  onClearAll?: () => void
  onPlaceBet?: (totalStake: number) => void
  flashBetEnabled?: boolean
  onFlashBetToggle?: (enabled: boolean) => void
}

export default function BetSlip({
  isOpen,
  bets,
  onClose,
  onRemoveBet,
  onClearAll,
  onPlaceBet,
  flashBetEnabled = false,
  onFlashBetToggle
}: BetSlipProps) {
  const [activeTab, setActiveTab] = useState<'simple' | 'accumulator' | 'system'>('accumulator')
  const [betAmount, setBetAmount] = useState(5)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate totals for accumulator
  const totalOdds = bets.length > 0 ? bets.reduce((product, bet) => product * bet.odds, 1) : 1
  const totalStake = betAmount
  const potentialWinnings = totalStake * totalOdds

  // Combined bet boost progress
  const boostProgress = 1 // 1 out of 4 bets
  const boostMultipliers = [
    { threshold: 1, multiplier: 1.05 },
    { threshold: 2, multiplier: 1.15 },
    { threshold: 3, multiplier: 1.25 },
    { threshold: 4, multiplier: 1.5 }
  ]

  const quickBetAmounts = [1, 10, 50, 100]

  const handleMaxBet = () => {
    // Set to user's max balance (mock for now)
    setBetAmount(1000)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Bottom Right Drawer */}
      <div
        className={`fixed bottom-0 right-0 bg-[#2a2a2a] border-t border-l border-border-primary transition-transform duration-300 flex flex-col z-[100] w-[400px] max-w-[90vw] ${
          isExpanded ? 'h-[90vh]' : 'h-[75vh]'
        } ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header Bar - Same as BottomActionBar */}
        <div className="bg-green-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-black font-semibold"
          >
            <Menu className="w-5 h-5" />
            <span>Coupon</span>
            {bets.length > 0 && (
              <span className="w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
                {bets.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-black font-semibold">PARI ÉCLAIR</span>
            <button
              onClick={() => onFlashBetToggle?.(!flashBetEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                flashBetEnabled ? 'bg-white' : 'bg-black/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform flex items-center justify-center ${
                  flashBetEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                <Zap className="w-3 h-3 text-white" />
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#2a2a2a]">
          {/* Flash Bet Mode Content */}
          {flashBetEnabled ? (
            <div className="space-y-6">
              {/* Informational Text */}
              <div className="space-y-2">
                <p className="text-white text-sm leading-relaxed">
                  Le mode Pari éclair est activé ! Vos paris seront placés immédiatement après un seul clic, peu importe la sélection. Consultez vos paris sur la{' '}
                  <button
                    onClick={() => window.location.href = '/sports/my-bets'}
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
                    onClick={() => setBetAmount(amount)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                      betAmount === amount
                        ? 'bg-green-500 text-white'
                        : 'bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]'
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
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
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
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('simple')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'simple'
                  ? 'bg-green-500 text-white'
                  : 'bg-bg-tertiary text-text-secondary'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setActiveTab('accumulator')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'accumulator'
                  ? 'bg-green-500 text-white'
                  : 'bg-bg-tertiary text-text-secondary'
              }`}
            >
              Pari combiné
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'system'
                  ? 'bg-green-500 text-white'
                  : 'bg-bg-tertiary text-text-secondary'
              }`}
            >
              Système
            </button>
          </div>

          {/* Bet Selections */}
          {bets.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              Votre coupon est vide
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-bg-tertiary rounded-lg p-4 border border-border-primary/50 relative"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveBet?.(bet.id)}
                    className="absolute left-2 top-2 w-6 h-6 bg-bg-secondary rounded-full flex items-center justify-center hover:bg-bg-primary transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>

                  {/* Bet Content */}
                  <div className="ml-8">
                    <div className="flex items-center gap-2 mb-1">
                      {bet.isLive && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                      <span className="text-sm font-semibold text-text-primary">
                        {bet.selection}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-1">
                      {bet.homeTeam} vs {bet.awayTeam}
                    </p>
                    <p className="text-xs text-text-secondary mb-2">{bet.marketType || '1x2'}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          bet.change === 'up' ? 'text-green-500' : 'text-white'
                        }`}
                      >
                        {bet.odds.toFixed(2)}
                      </span>
                      {bet.change === 'up' && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Combined Bet Boost Promotion */}
          {activeTab === 'accumulator' && bets.length > 0 && (
            <div className="bg-bg-tertiary border-2 border-green-500 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary bg-green-500 px-2 py-1 rounded">
                    COTE MIN: 1.5
                  </span>
                  <span className="text-xs text-text-secondary bg-green-500 px-2 py-1 rounded">
                    BOOST DE PARI COMBINÉ
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-primary mb-3">
                3 paris restants pour obtenir un multiplicateur de x1.05 sur vos gains!
              </p>
              {/* Progress Bar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  {boostMultipliers.map((boost, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="text-xs text-text-secondary">x{boost.multiplier}</span>
                      <ChevronDown className="w-3 h-3 text-text-secondary" />
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(boostProgress / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* boz.Topol Logo */}
          {activeTab === 'accumulator' && bets.length > 0 && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-black font-bold text-sm">boz</span>
                </div>
                <span className="text-white font-semibold">boz.Topol</span>
              </div>
            </div>
          )}

          {/* Bet Amount Input */}
          {bets.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-white text-lg font-semibold"
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={handleMaxBet}
                  className="px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-white font-semibold hover:bg-bg-primary transition-colors"
                >
                  MAX
                </button>
              </div>
              {/* Quick Bet Buttons */}
              <div className="flex gap-2">
                {quickBetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="flex-1 w-12 h-12 bg-bg-tertiary rounded-full text-white font-semibold hover:bg-bg-primary transition-colors"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bet Summary */}
          {bets.length > 0 && activeTab === 'accumulator' && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Cote totale</span>
                <span className="text-white font-semibold">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Mise Totale</span>
                <span className="text-white font-semibold">{totalStake} $</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">GAINS POTENTIELS</span>
                <span className="text-white font-bold text-lg">{potentialWinnings.toFixed(1)} $</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {bets.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => onPlaceBet?.(totalStake)}
                disabled={totalStake <= 0}
                className="w-full px-6 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                PLACER UN PARI
              </button>
              <button className="w-full px-6 py-3 bg-bg-tertiary text-white rounded-lg font-semibold hover:bg-bg-primary transition-colors">
                CODE DU PARI
              </button>
            </div>
          )}
            </>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#3a3a3a] border-t border-border-primary px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 text-white hover:text-green-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 text-white hover:text-green-500 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Réglages de cotes</span>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </button>
        </div>
      </div>
    </>
  )
}
