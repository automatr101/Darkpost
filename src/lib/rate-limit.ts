/**
 * Lightweight, zero-dependency in-memory rate limiter.
 * This stores tokens in memory. Note that on Vercel, memory isn't shared across
 * serverless function boundaries concurrently, meaning this serves as a localized
 * throttle against rapid DDoS or heavy scripting per instance.
 */

type MemoryCache = {
  [key: string]: { count: number; timestamp: number };
};

const cache: MemoryCache = {};

export function applyRateLimit(
  token: string,
  limit: number = 5,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();
  const record = cache[token];

  // Lazy cleanup of old records to prevent memory leaks if high unique tokens
  if (Object.keys(cache).length > 1000) {
    for (const key in cache) {
      if (now - cache[key].timestamp > windowMs) {
        delete cache[key];
      }
    }
  }

  if (!record || now - record.timestamp > windowMs) {
    // First request or window expired
    cache[token] = { count: 1, timestamp: now };
    return { success: true, limit, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    // Rate limit hit
    return { success: false, limit, remaining: 0 };
  }

  // Increment within window
  record.count += 1;
  return { success: true, limit, remaining: limit - record.count };
}
