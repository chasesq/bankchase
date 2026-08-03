/**
 * Request Cache - Deduplicates and caches API requests
 * Prevents thundering herd and improves performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private pending: Map<string, Promise<any>> = new Map()

  private getCacheKey(namespace: string, ...args: any[]): string {
    return `${namespace}:${JSON.stringify(args)}`
  }

  /**
   * Get from cache or execute function
   * Deduplicates concurrent requests for the same key
   */
  async getOrExecute<T>(
    namespace: string,
    ttl: number = 60000,
    args: any[],
    fn: () => Promise<T>
  ): Promise<T> {
    const key = this.getCacheKey(namespace, ...args)

    // Check if data is in cache and not expired
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // If request is already pending, return the pending promise (deduplication)
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }

    // Execute the function and store the pending promise
    const promise = fn()
      .then((data) => {
        // Store in cache
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        })
        return data
      })
      .finally(() => {
        // Remove from pending
        this.pending.delete(key)
      })

    this.pending.set(key, promise)
    return promise
  }

  /**
   * Invalidate cache entry
   */
  invalidate(namespace: string, ...args: any[]): void {
    const key = this.getCacheKey(namespace, ...args)
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.pending.clear()
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      entries: this.cache.size,
      pending: this.pending.size,
    }
  }
}

// Singleton instance
export const requestCache = new RequestCache()

/**
 * SWR-like hook for client-side caching
 */
export function createCacheKey(namespace: string, ...args: any[]): string {
  return `${namespace}:${JSON.stringify(args)}`
}

export class ConcurrencyLimiter {
  private running = 0
  private queue: Array<() => Promise<any>> = []

  constructor(private maxConcurrency: number = 5) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrency) {
      await new Promise((resolve) => {
        this.queue.push(resolve as any)
      })
    }

    this.running++

    try {
      return await fn()
    } finally {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

export const apiLimiter = new ConcurrencyLimiter(10)
