import { NextResponse } from 'next/server'
import { getGames, getEnabledProviders } from '@/lib/casino-api'
import { successResponse, errorResponse } from '@/lib/api-response'
import { getCachedData } from '@/lib/api-cache'
import { mapTypeToCategorySlug } from '@/lib/category-mapping'

// Next.js route segment config for caching
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    // Use shared cache with request deduplication
    // Fetch more pages to ensure we get ALL unique categories from your games
    // Some categories (like live casino, table games) might appear later in pagination
    const currency = process.env.CASINO_DEFAULT_CURRENCY || 'USD'
    const categories = await getCachedData(
      `categories-filtered-${currency}`,
      async () => {
        // Fetch games from Slotegrator API
        // Fetch 30 pages (1500 games) to ensure we capture all unique categories
        // This ensures categories are tailored to YOUR actual game library
        const gamesResponse = await getGames({ 
          fetchAll: false,
          maxPages: 30 // 30 pages = ~1500 games to get all unique categories
        })

        // Get enabled providers from the merchant's Slotegrator contract
        // This ensures categories only contain games that can actually be launched
        const enabledProvidersSet = await getEnabledProviders(currency)
        const hasEnabledList = enabledProvidersSet.size > 0

        // Extract unique categories from YOUR actual games, filtered by enabled providers
        // Group by slug to ensure no duplicate categories
        const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number; types: Set<string> }>()
        
        gamesResponse.items.forEach(game => {
          // Skip games from providers not enabled in the contract
          if (hasEnabledList) {
            const isEnabled = Array.from(enabledProvidersSet).some(
              ep => ep.toLowerCase() === game.provider.trim().toLowerCase()
            )
            if (!isEnabled) return
          }

          const slug = mapTypeToCategorySlug(game.type)
          
          if (categoryMap.has(slug)) {
            const existing = categoryMap.get(slug)!
            existing.count++
            existing.types.add(game.type.trim())
          } else {
            const displayName = game.type
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
            
            categoryMap.set(slug, {
              id: slug,
              name: displayName,
              slug: slug,
              count: 1,
              types: new Set([game.type.trim()])
            })
          }
        })
        
        // Filter out categories with very few games (less than 5) to keep it relevant
        // This ensures only categories with meaningful game counts are shown
        const filteredCategories = Array.from(categoryMap.values())
          .filter(cat => cat.count >= 5) // Only show categories with at least 5 games

        // Sort by game count (descending) then by name
        // This puts categories with more games first
        const sorted = filteredCategories.sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count // Sort by count descending
          }
          return a.name.localeCompare(b.name) // Then by name
        })

        // Remove count and types from final result (not needed in response)
        // Also ensure uniqueness by slug (in case of any edge cases)
        const uniqueCategories = sorted.map(({ count, types, ...rest }) => rest)
        
        // Final deduplication by slug (shouldn't be needed, but safety check)
        const seenSlugs = new Set<string>()
        return uniqueCategories.filter(cat => {
          if (seenSlugs.has(cat.slug)) {
            console.warn(`Duplicate category slug detected: ${cat.slug}, skipping duplicate`)
            return false
          }
          seenSlugs.add(cat.slug)
          return true
        })
      },
      3600000 // 1 hour TTL
    )

    // Return format expected by frontend with aggressive caching headers
    return NextResponse.json(
      { categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400, max-age=3600', // Cache for 2 hours server-side, 1 hour client-side
          'CDN-Cache-Control': 'public, s-maxage=7200',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Fallback: return static categories so the UI renders even when Slotegrator is unreachable
    // (e.g. local dev without static IP — the real API works on the VPS)
    const fallbackCategories = [
      { id: 'slots', name: 'Slots', slug: 'slots' },
      { id: 'live-casino', name: 'Live Casino', slug: 'live-casino' },
      { id: 'table-games', name: 'Table Games', slug: 'table-games' },
      { id: 'jackpot', name: 'Jackpot', slug: 'jackpot' },
      { id: 'video-poker', name: 'Video Poker', slug: 'video-poker' },
      { id: 'crash-games', name: 'Crash Games', slug: 'crash-games' },
    ]
    return NextResponse.json(
      { categories: fallbackCategories, fallback: true },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    )
  }
}




