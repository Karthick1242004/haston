import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

/**
 * Fixed-window rate limiting backed by MongoDB.
 *
 * Mongo rather than an in-process Map because route handlers may run on several
 * instances at once, and a per-instance counter silently multiplies every limit
 * by the instance count. The counters live in their own TTL collection so Mongo
 * reaps expired windows without a cleanup job.
 *
 * Deliberately fails OPEN: if the counter store is unreachable the request is
 * allowed through. A rate limiter that takes the checkout down when its own
 * storage hiccups is worse than the abuse it prevents.
 */

export interface RateLimitRule {
  /** Namespace, so limits on different routes never share a counter. */
  bucket: string
  /** Requests permitted per window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

// Tuned to be invisible to real users and painful to scripts.
export const RATE_LIMITS = {
  /** Coupon codes are guessable; this makes enumeration impractical. */
  couponApply: { bucket: 'coupon-apply', limit: 10, windowSeconds: 300 },
  /** Reviews are long-form; nobody writes six in five minutes. */
  reviewCreate: { bucket: 'review-create', limit: 5, windowSeconds: 300 },
  /** Each call hits Razorpay's API and creates a real merchant record. */
  paymentCreate: { bucket: 'payment-create', limit: 15, windowSeconds: 300 },
  /** Order placement, generous enough for retries after a failed payment. */
  orderCreate: { bucket: 'order-create', limit: 15, windowSeconds: 300 },
  /** Refund-adjacent, so worth throttling even though both are idempotent now. */
  orderMutation: { bucket: 'order-mutation', limit: 20, windowSeconds: 300 },
  /** Chatty by nature — every add/remove syncs — so this is a ceiling, not a throttle. */
  cartWrite: { bucket: 'cart-write', limit: 120, windowSeconds: 60 },
  /** Admin writes: catches a runaway script without hindering real work. */
  adminWrite: { bucket: 'admin-write', limit: 100, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>

/**
 * Identifies the caller. A session id is preferred because it survives shared
 * NATs and mobile IP churn; the forwarded IP is the fallback for anonymous
 * traffic. Only the leftmost x-forwarded-for entry is used, and it is length
 * capped so a forged header cannot bloat the key.
 */
export function getClientKey(request: NextRequest, sessionId?: string | null): string {
  if (sessionId) return `user:${sessionId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'

  return `ip:${ip.slice(0, 64)}`
}

export async function checkRateLimit(
  rule: RateLimitRule,
  clientKey: string
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = rule.windowSeconds * 1000
  // Bucketing by window start makes the counter self-expiring: a new window is
  // simply a new document, so there is no reset step to race against.
  const windowStart = Math.floor(now / windowMs) * windowMs
  const key = `${rule.bucket}:${clientKey}:${windowStart}`

  try {
    const db = await getDatabase()
    const counters = db.collection('rateLimits')

    const doc = await counters.findOneAndUpdate(
      { _id: key as any },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(windowStart + windowMs) },
      },
      { upsert: true, returnDocument: 'after' }
    )

    const count = ((doc as any)?.value ?? doc)?.count ?? 1
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000))

    return {
      allowed: count <= rule.limit,
      remaining: Math.max(0, rule.limit - count),
      retryAfterSeconds,
    }
  } catch (error) {
    console.error(`Rate limit store unavailable for ${rule.bucket}; allowing request:`, error)
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 }
  }
}

/**
 * Returns a 429 response when the caller is over the limit, or null to proceed.
 *
 *   const limited = await enforceRateLimit(request, RATE_LIMITS.couponApply, session?.user?.id)
 *   if (limited) return limited
 */
export async function enforceRateLimit(
  request: NextRequest,
  rule: RateLimitRule,
  sessionId?: string | null
): Promise<NextResponse | null> {
  const result = await checkRateLimit(rule, getClientKey(request, sessionId))
  if (result.allowed) return null

  return NextResponse.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(rule.limit),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}
