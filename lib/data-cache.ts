/**
 * Simple in-memory cache for data fetching
 */
class DataCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map()

  /**
   * Set a value in the cache with an optional expiry time
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, value: any, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl,
    })
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T = any>(key: string): T | undefined {
    const item = this.cache.get(key)

    // Return undefined if item doesn't exist or has expired
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Clean up expired item
        this.cache.delete(key)
      }
      return undefined
    }

    return item.data as T
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Clean up expired item
        this.cache.delete(key)
      }
      return false
    }
    return true
  }

  /**
   * Clear a specific key from the cache
   * @param key Cache key
   */
  clear(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all items from the cache
   */
  clearAll(): void {
    this.cache.clear()
  }
}

// Export a singleton instance
export const dataCache = new DataCache()
