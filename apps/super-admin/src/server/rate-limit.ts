/**
 * In-memory login rate limiter. Fine for a single long-running Node process
 * (local dev, a self-hosted instance) but does NOT work across multiple
 * serverless function instances (e.g. Vercel) — that needs a shared store
 * like Redis/Upstash. Documented limitation, not a bug: this is the
 * lightest thing that actually blocks a brute-force loop against this
 * single-instance MVP.
 */
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

const attempts = new Map<string, { count: number; firstAttemptAt: number }>()

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const entry = attempts.get(key)
  if (!entry) return { allowed: true }

  const elapsed = Date.now() - entry.firstAttemptAt
  if (elapsed > WINDOW_MS) {
    attempts.delete(key)
    return { allowed: true }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((WINDOW_MS - elapsed) / 1000) }
  }

  return { allowed: true }
}

export function recordLoginFailure(key: string) {
  const entry = attempts.get(key)
  if (!entry || Date.now() - entry.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: Date.now() })
  } else {
    entry.count += 1
  }
}

export function resetLoginAttempts(key: string) {
  attempts.delete(key)
}
