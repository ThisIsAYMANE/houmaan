import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (in production, use Redis or similar)
const store: RateLimitStore = {}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => {
      // Default: use IP address
      return (
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown'
      )
    },
  } = options

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(request)
    const now = Date.now()

    // Get or create rate limit entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      }
    }

    // Increment count
    store[key].count++

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((store[key].resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString(),
          },
        }
      )
    }

    // Add rate limit headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set(
      'X-RateLimit-Remaining',
      Math.max(0, maxRequests - store[key].count).toString()
    )
    response.headers.set('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString())

    return null // Continue to next middleware/handler
  }
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // Strict rate limit (10 requests per minute)
  strict: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // Standard rate limit (100 requests per minute)
  standard: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  // Auth rate limit (5 requests per 15 minutes)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // API rate limit (1000 requests per hour)
  api: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  }),
}



