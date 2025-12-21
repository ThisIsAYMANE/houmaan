// User types
export interface User {
  id: string
  email: string
  username: string | null
  avatar: string | null
  vipLevel: number
  createdAt: Date
}

export interface UserProfile {
  id: string
  userId: string
  firstName: string | null
  lastName: string | null
  language: string
  currency: string
  theme: string
  totalWinnings: number
  totalBets: number
  totalWagers: number
}

// Game types
export interface Game {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  gameUrl: string | null
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  playerCount: number
  multiplier: number | null
  provider: {
    id: string
    name: string
    logoUrl: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  }
}

export interface GameCategory {
  id: string
  name: string
  slug: string
  icon: string | null
}

// Sports types
export interface Match {
  id: string
  sportId: string
  leagueId: string
  homeTeam: string
  awayTeam: string
  homeTeamLogo: string | null
  awayTeamLogo: string | null
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  matchTime: Date | null
  currentScore: string | null
  homeScore: number | null
  awayScore: number | null
  isLive: boolean
  sport: {
    id: string
    name: string
    slug: string
  }
  league: {
    id: string
    name: string
    slug: string
  }
}

export interface Odds {
  id: string
  matchId: string
  marketId: string
  selection: string
  oddsValue: number
  previousOdds: number | null
  isActive: boolean
}

// Bet types
export interface UserBet {
  id: string
  userId: string
  gameId: string | null
  matchId: string | null
  betType: 'single' | 'accumulator' | 'system'
  marketType: string | null
  selection: string
  odds: number
  amount: number
  potentialWin: number | null
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  result: string | null
  payout: number | null
  currency: string
  placedAt: Date
}

// Wallet types
export interface Wallet {
  id: string
  userId: string
  currency: string
  balance: number
  lockedBalance: number
}

export interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description: string | null
  reference: string | null
  createdAt: Date
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    fields?: Record<string, string>
  }
}








