import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

interface RequestRecord {
  timestamp: number
  count: number
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map()

  private getKey(request: NextRequest, identifier?: string): string {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    return `${ip}:${identifier || 'default'}`
  }

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const record = this.records.get(key)

    if (!record || now - record.timestamp > config.interval) {
      // Create new record
      this.records.set(key, { timestamp: now, count: 1 })
      return true
    }

    // Increment count
    if (record.count < config.maxRequests) {
      record.count++
      return true
    }

    return false
  }

  cleanup(): void {
    const now = Date.now()
    const maxAge = 1000 * 60 * 60 // 1 hour
    
    for (const [key, record] of this.records.entries()) {
      if (now - record.timestamp > maxAge) {
        this.records.delete(key)
      }
    }
  }

  getStatus(key: string, config: RateLimitConfig): { remaining: number; reset: number } {
    const record = this.records.get(key)
    if (!record) {
      return { remaining: config.maxRequests, reset: Date.now() + config.interval }
    }

    const remaining = Math.max(0, config.maxRequests - record.count)
    const reset = record.timestamp + config.interval

    return { remaining, reset }
  }
}

export const rateLimiter = new RateLimiter()

// Common rate limit configs
export const RATE_LIMITS = {
  // Authentication endpoints - very restrictive
  AUTH: { interval: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 minutes
  
  // Sensitive operations - restrictive
  SENSITIVE: { interval: 1 * 60 * 1000, maxRequests: 10 }, // 10 per minute
  
  // Regular API endpoints - moderate
  API: { interval: 1 * 60 * 1000, maxRequests: 60 }, // 60 per minute
  
  // Read operations - permissive
  READ: { interval: 1 * 60 * 1000, maxRequests: 300 }, // 300 per minute
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig,
  identifier?: string
) {
  return async (request: NextRequest) => {
    const key = `${request.headers.get('x-forwarded-for') || 'unknown'}:${identifier || 'default'}`

    if (!rateLimiter.isAllowed(key, config)) {
      const status = rateLimiter.getStatus(key, config)
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((status.reset - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': status.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(status.reset / 1000).toString(),
          },
        }
      )
    }

    const response = await handler(request)
    const status = rateLimiter.getStatus(key, config)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', status.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(status.reset / 1000).toString())

    return response
  }
}

// Cleanup old records every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 60 * 60 * 1000)
}
