'use client'

import { useState, useEffect } from 'react'
import { Settings, Users, AlertTriangle, DollarSign, Check, X } from 'lucide-react'

interface BettingLimit {
  minBet: number
  maxBet: number
  maxPayout: number
  maxPendingBets: number
  dailyBetLimit?: number
  weeklyBetLimit?: number
  monthlyBetLimit?: number
}

interface BettingRule {
  id: string
  name: string
  description: string
  type: string
  enabled: boolean
  priority: number
}

interface UserTier {
  name: string
  level: number
  limits: BettingLimit
}

const USER_TIERS = {
  bronze: { name: 'Bronze', level: 1 },
  silver: { name: 'Silver', level: 2 },
  gold: { name: 'Gold', level: 3 },
  platinum: { name: 'Platinum', level: 4 }
}

export default function BettingConfigPage() {
  const [activeTab, setActiveTab] = useState<'limits' | 'rules' | 'tiers'>('limits')
  const [globalLimits, setGlobalLimits] = useState<BettingLimit>({
    minBet: 1,
    maxBet: 100000,
    maxPayout: 1000000,
    maxPendingBets: 50
  })
  const [rules, setRules] = useState<BettingRule[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = () => {
    // Mock rules - in production, load from API
    setRules([
      {
        id: 'no_same_match',
        name: 'No Same Match in Accumulators',
        description: 'Prevent multiple selections from the same match',
        type: 'restriction',
        enabled: true,
        priority: 100
      },
      {
        id: 'min_acc_odds',
        name: 'Minimum Accumulator Odds',
        description: 'Each selection must have odds >= 1.10',
        type: 'validation',
        enabled: true,
        priority: 90
      },
      {
        id: 'max_acc_legs',
        name: 'Maximum Accumulator Legs',
        description: 'Limit selections to 20 per accumulator',
        type: 'restriction',
        enabled: true,
        priority: 95
      },
      {
        id: 'suspended_market',
        name: 'No Suspended Markets',
        description: 'Block bets on suspended markets',
        type: 'restriction',
        enabled: true,
        priority: 200
      }
    ])
  }

  const handleLimitChange = (field: keyof BettingLimit, value: number) => {
    setGlobalLimits(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveGlobalLimits = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call
      // await fetch('/api/admin/betting-limits', {
      //   method: 'POST',
      //   body: JSON.stringify(globalLimits)
      // })
      
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Global limits updated successfully' })
        setLoading(false)
      }, 500)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update limits' })
      setLoading(false)
    }
  }

  const toggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
    // TODO: Save to API
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Betting Configuration
        </h1>
        <p className="text-text-secondary">
          Manage betting limits, rules, and user tiers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-primary">
        <button
          onClick={() => setActiveTab('limits')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'limits'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <DollarSign className="w-5 h-5 inline mr-2" />
          Global Limits
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'rules'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          Betting Rules
        </button>
        <button
          onClick={() => setActiveTab('tiers')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'tiers'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          User Tiers
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Global Limits Tab */}
      {activeTab === 'limits' && (
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            Global Betting Limits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Minimum Bet (MAD)
              </label>
              <input
                type="number"
                value={globalLimits.minBet}
                onChange={(e) => handleLimitChange('minBet', Number(e.target.value))}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Maximum Bet (MAD)
              </label>
              <input
                type="number"
                value={globalLimits.maxBet}
                onChange={(e) => handleLimitChange('maxBet', Number(e.target.value))}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Maximum Payout (MAD)
              </label>
              <input
                type="number"
                value={globalLimits.maxPayout}
                onChange={(e) => handleLimitChange('maxPayout', Number(e.target.value))}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Max Pending Bets per User
              </label>
              <input
                type="number"
                value={globalLimits.maxPendingBets}
                onChange={(e) => handleLimitChange('maxPendingBets', Number(e.target.value))}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>

          <button
            onClick={saveGlobalLimits}
            disabled={loading}
            className="mt-6 px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Global Limits'}
          </button>
        </div>
      )}

      {/* Betting Rules Tab */}
      {activeTab === 'rules' && (
        <div className="bg-bg-secondary rounded-lg border border-border-primary p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              Betting Rules
            </h2>
            <button className="px-4 py-2 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-primary/90">
              Add New Rule
            </button>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg border border-border-primary"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-text-primary">
                      {rule.name}
                    </h3>
                    <span className="px-2 py-1 bg-bg-primary text-xs rounded text-text-secondary">
                      {rule.type}
                    </span>
                    <span className="text-xs text-text-secondary">
                      Priority: {rule.priority}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {rule.description}
                  </p>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    rule.enabled
                      ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  }`}
                >
                  {rule.enabled ? (
                    <>
                      <Check className="w-4 h-4 inline mr-1" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 inline mr-1" />
                      Disabled
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Tiers Tab */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(USER_TIERS).map(([key, tier]) => (
            <div
              key={key}
              className="bg-bg-secondary rounded-lg border border-border-primary p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary">
                  {tier.name}
                </h3>
                <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-lg font-semibold">
                  Level {tier.level}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Max Bet:</span>
                  <span className="text-text-primary font-semibold">
                    {/* Dynamic based on tier */}
                    {key === 'bronze' && '1,000 MAD'}
                    {key === 'silver' && '5,000 MAD'}
                    {key === 'gold' && '20,000 MAD'}
                    {key === 'platinum' && '100,000 MAD'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Max Pending:</span>
                  <span className="text-text-primary font-semibold">
                    {key === 'bronze' && '20 bets'}
                    {key === 'silver' && '50 bets'}
                    {key === 'gold' && '100 bets'}
                    {key === 'platinum' && '200 bets'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Daily Limit:</span>
                  <span className="text-text-primary font-semibold">
                    {key === 'bronze' && '5,000 MAD'}
                    {key === 'silver' && '20,000 MAD'}
                    {key === 'gold' && '100,000 MAD'}
                    {key === 'platinum' && '500,000 MAD'}
                  </span>
                </div>
              </div>

              <button className="mt-4 w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary font-semibold hover:bg-bg-primary transition-colors">
                <Settings className="w-4 h-4 inline mr-2" />
                Configure
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




