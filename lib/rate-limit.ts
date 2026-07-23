import { NextResponse } from "next/server"

/**
 * Lightweight in-memory rate limiter.
 *
 * NOTE: state lives in the Node process, so on Vercel's serverless /
 * multi-instance runtime each instance keeps its own counters. That's
 * intentionally "best-effort" — it raises the cost of brute force and
 * email-bombing meaningfully without a Redis dependency. For hard
 * guarantees across instances, swap the Map for Upstash Ratelimit
 * (the call sites below don't need to change).
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Opportunistic cleanup so the Map can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return
  buckets.forEach((b, key) => {
    if (b.resetAt <= now) buckets.delete(key)
  })
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * Returns ok=false once `limit` hits happen inside `windowMs`.
 * `key` should already include the action name, e.g. `login:1.2.3.4`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  existing.count++
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: limit - existing.count, retryAfterSec: 0 }
}

/**
 * Trusted client IP.
 *
 * IMPORTANT: the LEFTMOST `x-forwarded-for` entry is attacker-controlled
 * — a client can send `X-Forwarded-For: 1.2.3.4` and Vercel appends the
 * real IP to the END. So we prefer `x-real-ip` (set by Vercel's proxy to
 * the actual connecting IP, not spoofable), and only fall back to the
 * RIGHTMOST xff entry. Never trust xff[0].
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return "unknown"
}

/**
 * Convenience wrapper for route handlers. Returns a 429 NextResponse
 * when the limit is exceeded, or null when the request may proceed.
 */
export function checkRateLimit(
  req: Request,
  action: string,
  limit: number,
  windowMs: number,
  extraKey?: string,
): NextResponse | null {
  const key = `${action}:${clientIp(req)}${extraKey ? `:${extraKey}` : ""}`
  const result = rateLimit(key, limit, windowMs)
  if (result.ok) return null
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
  )
}
