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
    })
  : null;

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
  if (!redis) return fetcher();

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Redis hiccup — fall through to the real fetch.
  }

  const value = await fetcher();

  try {
    // Fire-and-forget: don't block the response on the cache write.
    redis.set(key, value, { ex: ttlSecs }).catch(() => {});
  } catch {
    // Ignore write errors.
  }

  return value;
}

/**
 * Invalidate one or more cache keys.
 */
export async function invalidateCache(...keys: string[]) {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Ignore.
  }
}
