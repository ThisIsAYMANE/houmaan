/**
 * Shared API cache with request deduplication
 * This prevents multiple simultaneous requests for the same data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

// Global cache storage (persists across API route instances in the same process)
const cache = new Map<string, CacheEntry<any>>()

// Request deduplication: track in-flight requests
const inFlightRequests = new Map<string, Promise<any>>()

const DEFAULT_TTL = 3600000 // 1 hour

/**
 * Get cached data or fetch it if not cached
 * Deduplicates simultaneous requests for the same key
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const now = Date.now()
  
  // Check cache first
  const cached = cache.get(key)
  if (cached && (now - cached.timestamp) < ttl) {
    return cached.data
  }

  // Check if there's already an in-flight request for this key
  const inFlight = inFlightRequests.get(key)
  if (inFlight) {
    // Wait for the existing request to complete
    return inFlight
  }

  // Create new request
  const promise = fetcher().then(data => {
    // Cache the result
    cache.set(key, {
      data,
      timestamp: now,
    })
    
    // Remove from in-flight requests
    inFlightRequests.delete(key)
    
    return data
  }).catch(error => {
    // Remove from in-flight requests on error
    inFlightRequests.delete(key)
    throw error
  })

  // Track this request
  inFlightRequests.set(key, promise)

  return promise
}

/**
 * Clear cache entry
 */
export function clearCache(key: string): void {
  cache.delete(key)
  inFlightRequests.delete(key)
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear()
  inFlightRequests.clear()
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    cacheSize: cache.size,
    inFlightRequests: inFlightRequests.size,
    cacheKeys: Array.from(cache.keys()),
  }
}

