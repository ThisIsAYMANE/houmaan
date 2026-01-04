/**
 * Validation Utility Tests
 */
import {
  registerSchema,
  loginSchema,
  placeBetSchema,
  depositSchema,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        phone: '+1234567890',
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short username', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'ab',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('placeBetSchema', () => {
    it('should validate correct bet data', () => {
      const validData = {
        betType: 'single',
        selection: 'home',
        odds: 2.5,
        amount: 100,
        currency: 'MAD',
      }

      const result = placeBetSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid bet type', () => {
      const invalidData = {
        betType: 'invalid',
        selection: 'home',
        odds: 2.5,
        amount: 100,
      }

      const result = placeBetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const invalidData = {
        betType: 'single',
        selection: 'home',
        odds: 2.5,
        amount: -100,
      }

      const result = placeBetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('depositSchema', () => {
    it('should validate correct deposit data', () => {
      const validData = {
        amount: 100,
        currency: 'MAD',
        method: 'crypto',
        network: 'bitcoin',
      }

      const result = depositSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid method', () => {
      const invalidData = {
        amount: 100,
        currency: 'MAD',
        method: 'invalid',
      }

      const result = depositSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})


