/**
 * Rate Limiter - Prevents brute force attacks
 * Tracks login attempts and API calls by user/IP
 */

interface RateLimitEntry {
  attempts: number[];
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly DEFAULT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly DEFAULT_MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 60 * 60 * 1000; // 1 hour

  /**
   * Check if a request should be rate limited
   * @param identifier - User ID, IP address, or email
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  checkLimit(
    identifier: string,
    maxAttempts: number = this.DEFAULT_MAX_ATTEMPTS,
    windowMs: number = this.DEFAULT_WINDOW
  ): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return false;
    }

    // Get or create entry
    const current = entry || { attempts: [] };

    // Filter out attempts outside the window
    current.attempts = current.attempts.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (current.attempts.length >= maxAttempts) {
      // Block for 1 hour
      current.blockedUntil = now + this.BLOCK_DURATION;
      this.limits.set(identifier, current);
      return false;
    }

    // Record this attempt
    current.attempts.push(now);
    this.limits.set(identifier, current);

    return true;
  }

  /**
   * Record a failed attempt
   * @param identifier - User ID, IP address, or email
   */
  recordFailedAttempt(identifier: string): void {
    this.checkLimit(identifier); // This will record the attempt
  }

  /**
   * Reset limits for an identifier (e.g., after successful login)
   * @param identifier - User ID, IP address, or email
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Get remaining attempts for an identifier
   * @param identifier - User ID, IP address, or email
   * @param maxAttempts - Maximum attempts allowed
   * @returns Number of remaining attempts
   */
  getRemainingAttempts(
    identifier: string,
    maxAttempts: number = this.DEFAULT_MAX_ATTEMPTS
  ): number {
    const entry = this.limits.get(identifier);
    if (!entry) return maxAttempts;

    const now = Date.now();
    const recentAttempts = entry.attempts.filter(
      (timestamp) => now - timestamp < this.DEFAULT_WINDOW
    );

    return Math.max(0, maxAttempts - recentAttempts.length);
  }

  /**
   * Get time until unblocked (in seconds)
   * @param identifier - User ID, IP address, or email
   * @returns Seconds until unblocked, or 0 if not blocked
   */
  getBlockedTimeRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry?.blockedUntil) return 0;

    const now = Date.now();
    if (entry.blockedUntil <= now) return 0;

    return Math.ceil((entry.blockedUntil - now) / 1000);
  }

  /**
   * Periodic cleanup of old entries
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.DEFAULT_WINDOW;

    for (const [key, entry] of this.limits.entries()) {
      // Remove if no recent attempts and not blocked
      if (
        entry.attempts.length === 0 ||
        (entry.attempts.every((t) => t < cutoff) && (!entry.blockedUntil || entry.blockedUntil < now))
      ) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Check if an identifier is currently blocked
   * @param identifier - User ID, IP address, or email
   * @returns true if blocked
   */
  isBlocked(identifier: string): boolean {
    const entry = this.limits.get(identifier);
    if (!entry?.blockedUntil) return false;

    const now = Date.now();
    return entry.blockedUntil > now;
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

// Error class for rate limit exceeded
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // seconds
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Helper function to check rate limit and throw error if exceeded
 * @param identifier - User ID, IP address, or email
 * @param maxAttempts - Maximum attempts allowed
 * @throws RateLimitError if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts?: number
): void {
  if (!rateLimiter.checkLimit(identifier, maxAttempts)) {
    const retryAfter = rateLimiter.getBlockedTimeRemaining(identifier);
    throw new RateLimitError(
      `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      retryAfter
    );
  }
}

/**
 * Get client IP address from request
 * Works with various proxy configurations
 */
export function getClientIP(headers: Headers | Record<string, string>): string {
  const getHeader = (name: string) => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name] || headers[name.toLowerCase()];
  };

  // Check various headers in order of preference
  const ip =
    getHeader('cf-connecting-ip') || // Cloudflare
    getHeader('x-real-ip') || // Nginx proxy
    getHeader('x-forwarded-for')?.split(',')[0]?.trim() || // Standard proxy
    getHeader('x-client-ip') ||
    '0.0.0.0';

  return ip;
}
