/**
 * Request cache and deduplication layer
 * Prevents duplicate API calls and provides instant cache responses
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class RequestCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly TTL = 5000; // 5 seconds cache TTL

  /**
   * Get cached data or fetch if not available
   * Deduplicates concurrent requests to the same endpoint
   */
  async fetch(key: string, fetcher: () => Promise<any>, options: { ttl?: number; skipCache?: boolean } = {}): Promise<any> {
    const ttl = options.ttl ?? this.TTL;
    
    // Skip cache if requested
    if (options.skipCache) {
      return fetcher();
    }

    // Check if there's a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return pending;
    }

    // Check cache
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < ttl) {
      const age = Math.round((now - cached.timestamp) / 1000);
      console.log(`✅ Cache hit: ${key} (age: ${age}s, ttl: ${ttl/1000}s)`);
      return cached.data;
    }

    // Create new request
    console.log(`🌐 Fetching: ${key}`);
    const promise = fetcher()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Invalidate cache for a specific key or pattern
   */
  invalidate(keyOrPattern: string | RegExp) {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
      this.pendingRequests.delete(keyOrPattern);
    } else {
      // Pattern-based invalidation
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
          this.pendingRequests.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    const cacheSize = this.cache.size;
    const pendingSize = this.pendingRequests.size;
    this.cache.clear();
    this.pendingRequests.clear();
    console.log(`🧹 Cache cleared: ${cacheSize} entries, ${pendingSize} pending requests`);
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export const requestCache = new RequestCache();
