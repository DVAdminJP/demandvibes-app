/**
 * In-memory sliding-window rate limiter.
 * For production with multiple Vercel instances, swap the Map for Upstash Redis.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  // Prune old entries every ~1000 calls to prevent memory leak
  if (Math.random() < 0.001) {
    for (const [k, v] of store.entries()) {
      if (now >= v.resetAt) store.delete(k);
    }
  }

  return {
    success: entry.count <= opts.limit,
    remaining: Math.max(0, opts.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
