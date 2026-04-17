/**
 * Simple in-memory rate limiter for auth endpoints.
 * Uses a sliding-window counter per IP.
 *
 * In production with multiple instances, swap for @upstash/ratelimit or similar.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // seconds until reset
}

/**
 * Check rate limit for a given key (typically IP + endpoint).
 * @param key - Unique identifier (e.g. "login:192.168.1.1")
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) }
  }

  entry.count++

  if (entry.count > maxRequests) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 1000) }
}

/**
 * Extract client IP from request headers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return '127.0.0.1'
}
