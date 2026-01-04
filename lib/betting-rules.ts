/**
 * Betting Rules Engine
 * 
 * Flexible rules system for managing betting constraints:
 * - Market compatibility (which markets can be combined)
 * - Same-match restrictions
 * - Odds restrictions
 * - Time-based rules
 * - Custom business rules
 */

import { queryOne } from './db'

export interface BettingRule {
  id: string
  name: string
  description: string
  type: 'restriction' | 'validation' | 'transformation'
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  action: RuleAction
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'
  value: any
}

export interface RuleAction {
  type: 'reject' | 'warn' | 'modify' | 'allow'
  message?: string
  modification?: {
    field: string
    value: any
  }
}

export interface RuleViolation {
  ruleId: string
  ruleName: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Predefined betting rules
 */
export const DEFAULT_BETTING_RULES: BettingRule[] = [
  {
    id: 'no_same_match_accumulators',
    name: 'No Same Match in Accumulators',
    description: 'Prevent multiple selections from the same match in accumulators',
    type: 'restriction',
    enabled: true,
    priority: 100,
    conditions: [
      { field: 'betType', operator: 'in', value: ['accumulator', 'system'] }
    ],
    action: {
      type: 'reject',
      message: 'Cannot combine multiple selections from the same match in an accumulator'
    }
  },
  {
    id: 'min_accumulator_odds',
    name: 'Minimum Accumulator Odds',
    description: 'Each selection in accumulator must have minimum odds',
    type: 'validation',
    enabled: true,
    priority: 90,
    conditions: [
      { field: 'betType', operator: 'equals', value: 'accumulator' },
      { field: 'selectionOdds', operator: 'less_than', value: 1.10 }
    ],
    action: {
      type: 'reject',
      message: 'Each selection in accumulator must have odds of at least 1.10'
    }
  },
  {
    id: 'max_accumulator_legs',
    name: 'Maximum Accumulator Legs',
    description: 'Limit the number of selections in an accumulator',
    type: 'restriction',
    enabled: true,
    priority: 95,
    conditions: [
      { field: 'betType', operator: 'equals', value: 'accumulator' },
      { field: 'selectionCount', operator: 'greater_than', value: 20 }
    ],
    action: {
      type: 'reject',
      message: 'Maximum 20 selections allowed in an accumulator'
    }
  },
  {
    id: 'no_related_contingencies',
    name: 'No Related Contingencies',
    description: 'Prevent betting on related outcomes (e.g., winner and over/under in same match)',
    type: 'restriction',
    enabled: true,
    priority: 85,
    conditions: [
      { field: 'betType', operator: 'equals', value: 'accumulator' }
    ],
    action: {
      type: 'warn',
      message: 'Selected markets may be related. Review your selections.'
    }
  },
  {
    id: 'live_bet_odds_movement',
    name: 'Live Bet Odds Movement Limit',
    description: 'Reject live bets if odds have changed significantly',
    type: 'validation',
    enabled: true,
    priority: 100,
    conditions: [
      { field: 'isLive', operator: 'equals', value: true },
      { field: 'oddsChangePercentage', operator: 'greater_than', value: 5 }
    ],
    action: {
      type: 'reject',
      message: 'Odds have changed significantly. Please accept new odds to continue.'
    }
  },
  {
    id: 'suspended_market',
    name: 'No Bets on Suspended Markets',
    description: 'Prevent betting on suspended markets',
    type: 'restriction',
    enabled: true,
    priority: 200,
    conditions: [
      { field: 'marketSuspended', operator: 'equals', value: true }
    ],
    action: {
      type: 'reject',
      message: 'This market is currently suspended and not accepting bets'
    }
  },
  {
    id: 'match_started',
    name: 'No Pre-Match Bets After Kickoff',
    description: 'Prevent pre-match betting after match has started',
    type: 'restriction',
    enabled: true,
    priority: 150,
    conditions: [
      { field: 'marketType', operator: 'equals', value: 'pre_match' },
      { field: 'matchStarted', operator: 'equals', value: true }
    ],
    action: {
      type: 'reject',
      message: 'Match has already started. Pre-match betting is closed.'
    }
  },
  {
    id: 'max_total_odds',
    name: 'Maximum Total Odds',
    description: 'Limit maximum combined odds for accumulators',
    type: 'restriction',
    enabled: true,
    priority: 80,
    conditions: [
      { field: 'betType', operator: 'equals', value: 'accumulator' },
      { field: 'totalOdds', operator: 'greater_than', value: 10000 }
    ],
    action: {
      type: 'reject',
      message: 'Maximum total odds allowed is 10,000'
    }
  }
]

/**
 * Rule evaluation engine
 */
export class BettingRulesEngine {
  private rules: BettingRule[]

  constructor(customRules: BettingRule[] = []) {
    // Merge default rules with custom rules
    this.rules = [...DEFAULT_BETTING_RULES, ...customRules]
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority) // Higher priority first
  }

  /**
   * Evaluate all rules against a bet
   */
  evaluateRules(betData: any): {
    allowed: boolean
    violations: RuleViolation[]
    warnings: RuleViolation[]
    modifications: any
  } {
    const violations: RuleViolation[] = []
    const warnings: RuleViolation[] = []
    const modifications: any = {}

    for (const rule of this.rules) {
      const result = this.evaluateRule(rule, betData)
      
      if (result.violated) {
        if (rule.action.type === 'reject') {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: rule.action.message || 'Rule violation',
            severity: 'error'
          })
        } else if (rule.action.type === 'warn') {
          warnings.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: rule.action.message || 'Warning',
            severity: 'warning'
          })
        } else if (rule.action.type === 'modify' && rule.action.modification) {
          modifications[rule.action.modification.field] = rule.action.modification.value
        }
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings,
      modifications
    }
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(rule: BettingRule, betData: any): { violated: boolean } {
    // Check if all conditions are met
    const conditionsMet = rule.conditions.every(condition => 
      this.evaluateCondition(condition, betData)
    )

    return { violated: conditionsMet }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, betData: any): boolean {
    const fieldValue = this.getFieldValue(betData, condition.field)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      
      case 'not_equals':
        return fieldValue !== condition.value
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      
      default:
        return false
    }
  }

  /**
   * Get field value from bet data (supports nested paths)
   */
  private getFieldValue(data: any, field: string): any {
    const parts = field.split('.')
    let value = data

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined
      }
      value = value[part]
    }

    return value
  }

  /**
   * Add custom rule
   */
  addRule(rule: BettingRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId)
  }

  /**
   * Enable/disable rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.enabled = enabled
    }
  }
}

/**
 * Check for same match selections in accumulator
 */
export function hasSameMatchSelections(selections: Array<{ matchId: string }>): boolean {
  const matchIds = selections.map(s => s.matchId)
  const uniqueMatchIds = new Set(matchIds)
  return matchIds.length !== uniqueMatchIds.size
}

/**
 * Check if markets are related/contingent
 * (e.g., match winner and total goals in same match)
 */
export function areMarketsRelated(
  selections: Array<{ matchId: string; marketType: string }>
): boolean {
  // Group by match
  const matchGroups = new Map<string, string[]>()
  
  for (const sel of selections) {
    if (!matchGroups.has(sel.matchId)) {
      matchGroups.set(sel.matchId, [])
    }
    matchGroups.get(sel.matchId)!.push(sel.marketType)
  }

  // Check each match's markets
  for (const [_, marketTypes] of matchGroups) {
    if (marketTypes.length > 1) {
      // Multiple markets from same match - check if related
      const related = checkMarketCompatibility(marketTypes)
      if (!related) {
        return true // Markets are related/incompatible
      }
    }
  }

  return false
}

/**
 * Check if market types can be combined
 */
function checkMarketCompatibility(marketTypes: string[]): boolean {
  const incompatiblePairs = [
    ['1x2', 'double_chance'], // Match result and double chance
    ['btts', 'total_goals'],  // BTTS and total goals
    ['correct_score', '1x2'], // Correct score and match result
  ]

  for (const [type1, type2] of incompatiblePairs) {
    if (marketTypes.includes(type1) && marketTypes.includes(type2)) {
      return false
    }
  }

  return true
}

/**
 * Load custom rules from database
 */
export async function loadCustomRules(): Promise<BettingRule[]> {
  try {
    const result = await queryOne<{ rules_json: string }>(
      'SELECT rules_json FROM betting_rules_config WHERE id = 1'
    )

    if (!result || !result.rules_json) {
      return []
    }

    return JSON.parse(result.rules_json) as BettingRule[]
  } catch (error) {
    console.error('Error loading custom rules:', error)
    return []
  }
}

/**
 * Initialize rules engine with custom rules
 */
export async function initializeRulesEngine(): Promise<BettingRulesEngine> {
  const customRules = await loadCustomRules()
  return new BettingRulesEngine(customRules)
}


