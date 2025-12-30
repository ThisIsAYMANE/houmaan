import { z } from 'zod'

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Game validation schemas
export const gameSearchSchema = z.object({
  q: z.string().min(3, 'Search query must be at least 3 characters'),
  category: z.string().optional(),
  provider: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Bet validation schemas
export const placeBetSchema = z.object({
  matchId: z.string().optional(),
  gameId: z.string().optional(),
  betType: z.enum(['single', 'accumulator', 'system']),
  marketType: z.string().optional(),
  selection: z.string(),
  odds: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
  currency: z.string().default('MAD'),
})

// Wallet validation schemas
export const depositSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string(),
  method: z.enum(['crypto', 'fiat', 'smart_deposit']),
  network: z.string().optional(),
})

export const withdrawSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string(),
  method: z.enum(['crypto', 'fiat']),
  network: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GameSearchInput = z.infer<typeof gameSearchSchema>
export type PlaceBetInput = z.infer<typeof placeBetSchema>
export type DepositInput = z.infer<typeof depositSchema>
export type WithdrawInput = z.infer<typeof withdrawSchema>











