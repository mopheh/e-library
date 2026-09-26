// lib/redis.ts
// Shared, singleton Redis client for caching and rate-limiting.
// Import this instead of constructing `new Redis()` inline anywhere.

import { Redis } from "@upstash/redis";

const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis: Redis | null = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      // The client's default is 5 retries with exponential backoff (~5s
      // before giving up). Redis here is only a cache/rate limiter, so it's
      // always cheaper to fall back to the database than to wait.
      retry: { retries: 1, backoff: () => 50 },
    })
  : null;

// ---------------------------------------------------------------------------
// Circuit breaker
// ---------------------------------------------------------------------------
// If Redis is down (outage, deleted database, DNS failure), every request
// would otherwise pay a timeout before falling back. After one failure we
// skip Redis entirely for a short cooldown, then try again - so an outage
// costs ~one slow request per instance per cooldown, not one per request.

const REDIS_TIMEOUT_MS = 800;
const COOLDOWN_MS = 30_000;
let openUntil = 0;

export function redisAvailable() {
  return redis !== null && Date.now() >= openUntil;
}

export function markRedisFailure() {
  if (Date.now() >= openUntil) {
    console.warn(`[redis] unavailable - bypassing for ${COOLDOWN_MS / 1000}s`);
  }
  openUntil = Date.now() + COOLDOWN_MS;
}

/** Runs a Redis operation with a hard timeout; trips the breaker on failure. */
export async function guarded<T>(op: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      op(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("redis timeout")), REDIS_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    markRedisFailure();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/**
 * Read-through cache with automatic JSON serialisation.
 *
 * @param key      Cache key
 * @param ttlSecs  Time-to-live in seconds
 * @param fetcher  Async function that produces the value on a cache miss
 */
export async function withCache<T>(
  key: string,
  ttlSecs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // If Redis is unavailable just call the fetcher directly — no crash.
  if (!redis || !redisAvailable()) return fetcher();
  const client = redis;

  try {
    const cached = await guarded(() => client.get<T>(key));
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Redis hiccup — fall through to the real fetch.
  }

  const value = await fetcher();

  if (redisAvailable()) {
    // Fire-and-forget: don't block the response on the cache write.
    guarded(() => client.set(key, value, { ex: ttlSecs })).catch(() => {});
  }

  return value;
}

/**
 * Invalidate one or more cache keys.
 */
export async function invalidateCache(...keys: string[]) {
  if (!redis || keys.length === 0 || !redisAvailable()) return;
  const client = redis;
  try {
    await guarded(() => client.del(...keys));
  } catch {
    // Ignore - entries still expire via their TTL.
  }
}
