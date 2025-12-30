import { z } from 'zod'

/**
 * Enhanced validation schemas with security considerations
 */

// Sanitize string input (remove potentially dangerous characters)
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Sanitize number input
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input
  }
  if (typeof input === 'string') {
    const num = parseFloat(input)
    return isNaN(num) ? null : num
  }
  return null
}

// Enhanced email validation
export const enhancedEmailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((val) => sanitizeString(val.toLowerCase()))

// Enhanced string schema with XSS protection
export const safeStringSchema = z
  .string()
  .max(1000, 'String too long')
  .transform((val) => sanitizeString(val))

// Wallet address validation (Bitcoin)
export const bitcoinAddressSchema = z
  .string()
  .regex(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/, {
    message: 'Invalid Bitcoin address',
  })
  .max(100, 'Address too long')

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address',
  })
  .max(100, 'Address too long')

// Amount validation (positive decimal)
export const positiveAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(1000000000, 'Amount too large')
  .refine((val) => {
    // Check decimal places (max 8 for Bitcoin)
    const decimalPlaces = val.toString().split('.')[1]?.length || 0
    return decimalPlaces <= 8
  }, 'Too many decimal places')

// Transaction type validation
export const transactionTypeSchema = z.enum([
  'deposit',
  'withdrawal',
  'bet_placed',
  'bet_won',
  'bet_lost',
  'bet_cancelled',
  'casino_spin',
  'casino_win',
  'bonus_credited',
  'bonus_used',
  'refund',
  'adjustment',
])

// Status validation
export const transactionStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'reversed',
])

// SQL injection prevention - check for dangerous SQL keywords
export function containsSQLInjection(input: string): boolean {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(--|\#|\/\*|\*\/)/g, // SQL comments
    /(;|\||&)/g, // Command separators
  ]

  return dangerousPatterns.some((pattern) => pattern.test(input))
}

// XSS prevention - check for dangerous HTML/JS
export function containsXSS(input: string): boolean {
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ]

  return dangerousPatterns.some((pattern) => pattern.test(input))
}

// Validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(input)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: result.error.errors.map((e) => e.message).join(', '),
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

