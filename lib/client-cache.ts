/**
 * Client-side caching utility using localStorage
 * Caches data in browser to prevent unnecessary API calls
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

/**
 * Get cached data from localStorage
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is expired
    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error)
    return null
  }
}

/**
 * Set cached data in localStorage
 */
export function setCachedData<T>(key: string, data: T, ttl: number = 3600000): void {
  if (typeof window === 'undefined') return

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    console.error(`Error setting cache for ${key}:`, error)
    // If quota exceeded, try to clear old cache
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearExpiredCache()
      try {
        localStorage.setItem(key, JSON.stringify(entry))
      } catch (retryError) {
        console.error('Failed to cache after clearing expired items:', retryError)
      }
    }
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return
  
  // Only clear cache entries (keys starting with 'cache_')
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  if (typeof window === 'undefined') return

  const keys = Object.keys(localStorage)
  const now = Date.now()

  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      try {
        const cached = localStorage.getItem(key)
        if (cached) {
          const entry = JSON.parse(cached)
          if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key)
          }
        }
      } catch {
        // Invalid cache entry, remove it
        localStorage.removeItem(key)
      }
    }
  })
}

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  GAMES: 'cache_games',
  GAMES_LOBBY: 'cache_games_lobby',
  CATEGORIES: 'cache_categories',
  PROVIDERS: 'cache_providers',
} as const



