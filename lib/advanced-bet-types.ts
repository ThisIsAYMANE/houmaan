/**
 * Advanced Bet Types Calculator
 * 
 * Supports:
 * - System bets (e.g., Trixie, Patent, Yankee)
 * - Combination bets
 * - Each-way bets
 * - Special bet types
 */

export interface BetSelection {
  matchId: string
  marketId: string
  selection: string
  odds: number
  marketType?: string
}

export interface SystemBetCalculation {
  type: string
  totalCombinations: number
  totalStake: number
  potentialReturn: number
  potentialProfit: number
  combinations: Array<{
    selections: number[]
    odds: number
    stake: number
    potentialReturn: number
  }>
}

/**
 * System bet types configuration
 */
export const SYSTEM_BET_TYPES = {
  // 3 selections
  trixie: {
    name: 'Trixie',
    minSelections: 3,
    maxSelections: 3,
    description: '4 bets: 3 doubles + 1 treble',
    combinations: [
      { size: 2, count: 3 }, // 3 doubles
      { size: 3, count: 1 }  // 1 treble
    ]
  },
  patent: {
    name: 'Patent',
    minSelections: 3,
    maxSelections: 3,
    description: '7 bets: 3 singles + 3 doubles + 1 treble',
    combinations: [
      { size: 1, count: 3 }, // 3 singles
      { size: 2, count: 3 }, // 3 doubles
      { size: 3, count: 1 }  // 1 treble
    ]
  },
  
  // 4 selections
  yankee: {
    name: 'Yankee',
    minSelections: 4,
    maxSelections: 4,
    description: '11 bets: 6 doubles + 4 trebles + 1 four-fold',
    combinations: [
      { size: 2, count: 6 }, // 6 doubles
      { size: 3, count: 4 }, // 4 trebles
      { size: 4, count: 1 }  // 1 four-fold
    ]
  },
  lucky15: {
    name: 'Lucky 15',
    minSelections: 4,
    maxSelections: 4,
    description: '15 bets: 4 singles + 6 doubles + 4 trebles + 1 four-fold',
    combinations: [
      { size: 1, count: 4 }, // 4 singles
      { size: 2, count: 6 }, // 6 doubles
      { size: 3, count: 4 }, // 4 trebles
      { size: 4, count: 1 }  // 1 four-fold
    ]
  },
  
  // 5 selections
  canadian: {
    name: 'Canadian (Super Yankee)',
    minSelections: 5,
    maxSelections: 5,
    description: '26 bets: 10 doubles + 10 trebles + 5 four-folds + 1 five-fold',
    combinations: [
      { size: 2, count: 10 }, // 10 doubles
      { size: 3, count: 10 }, // 10 trebles
      { size: 4, count: 5 },  // 5 four-folds
      { size: 5, count: 1 }   // 1 five-fold
    ]
  },
  lucky31: {
    name: 'Lucky 31',
    minSelections: 5,
    maxSelections: 5,
    description: '31 bets: 5 singles + 10 doubles + 10 trebles + 5 four-folds + 1 five-fold',
    combinations: [
      { size: 1, count: 5 },  // 5 singles
      { size: 2, count: 10 }, // 10 doubles
      { size: 3, count: 10 }, // 10 trebles
      { size: 4, count: 5 },  // 5 four-folds
      { size: 5, count: 1 }   // 1 five-fold
    ]
  },
  
  // 6 selections
  heinz: {
    name: 'Heinz',
    minSelections: 6,
    maxSelections: 6,
    description: '57 bets: 15 doubles + 20 trebles + 15 four-folds + 6 five-folds + 1 six-fold',
    combinations: [
      { size: 2, count: 15 }, // 15 doubles
      { size: 3, count: 20 }, // 20 trebles
      { size: 4, count: 15 }, // 15 four-folds
      { size: 5, count: 6 },  // 6 five-folds
      { size: 6, count: 1 }   // 1 six-fold
    ]
  },
  lucky63: {
    name: 'Lucky 63',
    minSelections: 6,
    maxSelections: 6,
    description: '63 bets: 6 singles + 15 doubles + 20 trebles + 15 four-folds + 6 five-folds + 1 six-fold',
    combinations: [
      { size: 1, count: 6 },  // 6 singles
      { size: 2, count: 15 }, // 15 doubles
      { size: 3, count: 20 }, // 20 trebles
      { size: 4, count: 15 }, // 15 four-folds
      { size: 5, count: 6 },  // 6 five-folds
      { size: 6, count: 1 }   // 1 six-fold
    ]
  }
}

/**
 * Calculate combinations (n choose k)
 */
function combinations(n: number, k: number): number {
  if (k > n) return 0
  if (k === 0 || k === n) return 1
  
  let result = 1
  for (let i = 0; i < k; i++) {
    result *= (n - i)
    result /= (i + 1)
  }
  return Math.round(result)
}

/**
 * Generate all combinations of k selections from n
 */
function generateCombinations(arr: any[], k: number): any[][] {
  if (k === 0) return [[]]
  if (arr.length === 0) return []
  
  const [first, ...rest] = arr
  const withFirst = generateCombinations(rest, k - 1).map(c => [first, ...c])
  const withoutFirst = generateCombinations(rest, k)
  
  return [...withFirst, ...withoutFirst]
}

/**
 * Calculate system bet
 */
export function calculateSystemBet(
  selections: BetSelection[],
  systemType: keyof typeof SYSTEM_BET_TYPES,
  unitStake: number
): SystemBetCalculation {
  const system = SYSTEM_BET_TYPES[systemType]
  
  if (!system) {
    throw new Error(`Unknown system bet type: ${systemType}`)
  }
  
  if (selections.length < system.minSelections || selections.length > system.maxSelections) {
    throw new Error(
      `${system.name} requires exactly ${system.minSelections} selections, got ${selections.length}`
    )
  }
  
  const allCombinations: Array<{
    selections: number[]
    odds: number
    stake: number
    potentialReturn: number
  }> = []
  
  let totalCombinations = 0
  
  // Generate combinations for each size
  for (const { size, count } of system.combinations) {
    const combs = generateCombinations(
      selections.map((_, i) => i),
      size
    )
    
    for (const comb of combs) {
      // Calculate combined odds
      const combinedOdds = comb.reduce((acc, idx) => acc * selections[idx].odds, 1)
      
      allCombinations.push({
        selections: comb,
        odds: combinedOdds,
        stake: unitStake,
        potentialReturn: unitStake * combinedOdds
      })
    }
    
    totalCombinations += count
  }
  
  const totalStake = totalCombinations * unitStake
  const potentialReturn = allCombinations.reduce((sum, c) => sum + c.potentialReturn, 0)
  const potentialProfit = potentialReturn - totalStake
  
  return {
    type: system.name,
    totalCombinations,
    totalStake,
    potentialReturn,
    potentialProfit,
    combinations: allCombinations
  }
}

/**
 * Calculate winnings for system bet based on results
 */
export function calculateSystemBetWinnings(
  calculation: SystemBetCalculation,
  wonSelectionIndices: number[]
): number {
  let totalWinnings = 0
  
  for (const comb of calculation.combinations) {
    // Check if all selections in this combination won
    const allWon = comb.selections.every(idx => wonSelectionIndices.includes(idx))
    
    if (allWon) {
      totalWinnings += comb.potentialReturn
    }
  }
  
  return totalWinnings
}

/**
 * Calculate standard accumulator (all selections must win)
 */
export function calculateAccumulator(
  selections: BetSelection[],
  stake: number
): {
  totalOdds: number
  stake: number
  potentialReturn: number
  potentialProfit: number
} {
  if (selections.length < 2) {
    throw new Error('Accumulator requires at least 2 selections')
  }
  
  const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1)
  const potentialReturn = stake * totalOdds
  const potentialProfit = potentialReturn - stake
  
  return {
    totalOdds,
    stake,
    potentialReturn,
    potentialProfit
  }
}

/**
 * Calculate each-way bet
 * (Two bets: one for win, one for place)
 */
export function calculateEachWay(
  odds: number,
  stake: number,
  placeTerms: { places: number; fraction: number } = { places: 3, fraction: 0.25 }
): {
  totalStake: number
  winReturn: number
  placeReturn: number
  maxReturn: number
} {
  const totalStake = stake * 2 // Win + Place
  const placeOdds = 1 + ((odds - 1) * placeTerms.fraction)
  
  const winReturn = stake * odds
  const placeReturn = stake * placeOdds
  const maxReturn = winReturn + placeReturn // If both win and place
  
  return {
    totalStake,
    winReturn,
    placeReturn,
    maxReturn
  }
}

/**
 * Validate bet selections
 */
export function validateBetSelections(selections: BetSelection[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (selections.length === 0) {
    errors.push('At least one selection is required')
  }
  
  // Check for duplicate selections (same match and market)
  const seen = new Set<string>()
  for (const sel of selections) {
    const key = `${sel.matchId}-${sel.marketId}`
    if (seen.has(key)) {
      errors.push(`Duplicate selection for match ${sel.matchId} and market ${sel.marketId}`)
    }
    seen.add(key)
  }
  
  // Validate odds
  for (const sel of selections) {
    if (sel.odds < 1) {
      errors.push(`Invalid odds ${sel.odds} for selection ${sel.selection}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get available system bet types for number of selections
 */
export function getAvailableSystemBets(selectionCount: number): Array<{
  type: string
  name: string
  description: string
  totalBets: number
}> {
  const available: Array<{
    type: string
    name: string
    description: string
    totalBets: number
  }> = []
  
  for (const [type, system] of Object.entries(SYSTEM_BET_TYPES)) {
    if (selectionCount >= system.minSelections && selectionCount <= system.maxSelections) {
      const totalBets = system.combinations.reduce((sum, c) => sum + c.count, 0)
      available.push({
        type,
        name: system.name,
        description: system.description,
        totalBets
      })
    }
  }
  
  return available
}




