/**
 * Rate Limiting utility for Server Actions
 * Prevents abuse by limiting requests per user/IP
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

// In-memory store (for serverless, consider Redis in production)
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) {
            rateLimitMap.delete(key);
        }
    }
}, 60000); // Clean every minute

/**
 * Check if a request is within rate limits
 * @param key - Unique identifier (userId, IP, or action:userId)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
    key: string,
    limit = 60,
    windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    // First request or window expired
    if (!record || now > record.resetAt) {
        const newRecord = { count: 1, resetAt: now + windowMs };
        rateLimitMap.set(key, newRecord);
        return { allowed: true, remaining: limit - 1, resetAt: newRecord.resetAt };
    }

    // Within window, check limit
    if (record.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    // Increment count
    record.count++;
    return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

/**
 * Rate limit configurations for different actions
 */
export const RATE_LIMITS = {
    chat: { limit: 30, windowMs: 60000 },      // 30 messages per minute
    marketing: { limit: 10, windowMs: 60000 }, // 10 campaign generations per minute
    export: { limit: 5, windowMs: 60000 },     // 5 exports per minute
    settings: { limit: 20, windowMs: 60000 },  // 20 settings updates per minute
} as const;

/**
 * Helper to create a rate limit key
 */
export function createRateLimitKey(action: keyof typeof RATE_LIMITS, userId: string): string {
    return `${action}:${userId}`;
}

/**
 * Check rate limit for a specific action
 * @throws Error if rate limit exceeded
 */
export function enforceRateLimit(action: keyof typeof RATE_LIMITS, userId: string): void {
    const config = RATE_LIMITS[action];
    const key = createRateLimitKey(action, userId);
    const result = checkRateLimit(key, config.limit, config.windowMs);

    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    }
}
