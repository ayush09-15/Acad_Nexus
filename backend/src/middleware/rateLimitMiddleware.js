/**
 * Production-Grade Sliding Window Rate Limiter Middleware
 *
 * Protects against:
 * 1. Brute-force login and credential stuffing attacks on /api/auth.
 * 2. Rapid-fire automated spamming on AI query endpoints (/api/classes/:id/chat)
 *    to preserve Gemini API quotas and Pinecone serverless limits.
 * 3. File upload flooding on /api/classes/:id/materials.
 *
 * Implemented with zero external dependencies to prevent supply-chain vulnerabilities.
 */

function createRateLimiter({
  windowMs = 60 * 1000,
  max = 20,
  message = "Too many requests. Please try again later.",
  keyGenerator = (req) =>
    req.user?.id ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "global-client",
}) {
  // Store: Map<key, Array<number>> (array of request timestamps)
  const hits = new Map();

  // Periodic cleanup of expired windows to prevent memory leaks
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, active);
      }
    }
  }, Math.max(windowMs, 60000));

  if (interval.unref) {
    interval.unref(); // Prevent timer from keeping Node process alive in tests
  }

  const limiter = (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

    const remaining = Math.max(0, max - timestamps.length);
    const oldest = timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

    // Standard RFC RateLimit response headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining - 1));
    res.setHeader("X-RateLimit-Reset", retryAfterSeconds);

    if (timestamps.length >= max) {
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };

  // Helper method for unit tests to reset store
  limiter.reset = () => hits.clear();

  return limiter;
}

/**
 * Auth Rate Limiter: Max 10 attempts per 15 minutes per IP
 * Protects against password guessing and spam registration.
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts from this IP. Please wait 15 minutes before trying again.",
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "auth-ip",
});

/**
 * AI Query Rate Limiter: Max 15 questions per minute per student
 * Protects Gemini 3.5 Flash and Pinecone query limits from runaway scripts.
 */
const aiQueryLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: "You're asking questions too quickly! Please wait a moment before sending another query to protect classroom AI resources.",
  keyGenerator: (req) =>
    req.user?.id ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "ai-client",
});

/**
 * Study Material Upload Limiter: Max 10 uploads per 5 minutes per professor
 * Prevents storage and vector indexing queue exhaustion.
 */
const uploadLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Upload rate limit reached. Please wait a few minutes before uploading more documents.",
  keyGenerator: (req) => req.user?.id || "upload-prof",
});

module.exports = {
  createRateLimiter,
  authLimiter,
  aiQueryLimiter,
  uploadLimiter,
};
