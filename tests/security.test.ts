/**
 * Security middleware tests
 */

import { describe, it, expect } from '@jest/globals'
import { rateLimiters } from '../middleware/rate-limit'
import { containsSQLInjection, containsXSS } from '../lib/validation-enhanced'
import { NextRequest } from 'next/server'

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      })

      // First 10 requests should pass
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiters.strict(request)
        expect(result).toBeNull() // Null means allowed
      }
    })

    it('should block requests exceeding limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '127.0.0.2',
        },
      })

      // Make 11 requests (exceeding limit of 10)
      let result: any = null
      for (let i = 0; i < 11; i++) {
        result = await rateLimiters.strict(request)
      }

      expect(result).not.toBeNull()
      expect(result?.status).toBe(429)
    })
  })

  describe('SQL Injection Detection', () => {
    it('should detect SQL injection attempts', () => {
      expect(containsSQLInjection("'; DROP TABLE users; --")).toBe(true)
      expect(containsSQLInjection("SELECT * FROM users")).toBe(true)
      expect(containsSQLInjection("1' OR '1'='1")).toBe(true)
      expect(containsSQLInjection("normal text")).toBe(false)
    })
  })

  describe('XSS Detection', () => {
    it('should detect XSS attempts', () => {
      expect(containsXSS('<script>alert("xss")</script>')).toBe(true)
      expect(containsXSS('javascript:alert(1)')).toBe(true)
      expect(containsXSS('onclick="alert(1)"')).toBe(true)
      expect(containsXSS('<iframe src="evil.com"></iframe>')).toBe(true)
      expect(containsXSS('normal text')).toBe(false)
    })
  })
})





