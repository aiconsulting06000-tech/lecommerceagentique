/**
 * Simple in-memory rate limiter.
 * - Per-IP: configurable max requests per window
 * - Global: caps total requests in window across all IPs (DoS protection)
 *
 * Note: in-memory means each Vercel serverless instance has its own counter.
 * Acceptable for warm functions, not perfect. For stricter limits, swap to Supabase or Redis later.
 */

interface Bucket {
  count: number
  reset: number
}

const ipBuckets = new Map<string, Bucket>()
const globalBucket: Bucket = { count: 0, reset: 0 }

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetIn: number
}

export function rateLimit(
  ip: string,
  opts: { perIp: number; perIpWindowMs: number; global: number; globalWindowMs: number },
): RateLimitResult {
  const now = Date.now()

  // Cleanup stale buckets opportunistically (cheap, bounded)
  if (ipBuckets.size > 1000) {
    for (const [k, b] of ipBuckets.entries()) {
      if (b.reset < now) ipBuckets.delete(k)
    }
  }

  // Global bucket
  if (globalBucket.reset < now) {
    globalBucket.count = 0
    globalBucket.reset = now + opts.globalWindowMs
  }
  globalBucket.count++
  if (globalBucket.count > opts.global) {
    return { ok: false, remaining: 0, resetIn: globalBucket.reset - now }
  }

  // Per-IP bucket
  let b = ipBuckets.get(ip)
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + opts.perIpWindowMs }
    ipBuckets.set(ip, b)
  }
  b.count++
  if (b.count > opts.perIp) {
    return { ok: false, remaining: 0, resetIn: b.reset - now }
  }

  return { ok: true, remaining: opts.perIp - b.count, resetIn: b.reset - now }
}

export function getClientIp(req: Request): string {
  // Vercel forwards client IP in x-forwarded-for
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
