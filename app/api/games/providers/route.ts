import { NextResponse } from 'next/server'
import { getGames, getEnabledProviders } from '@/lib/casino-api'
import { successResponse, errorResponse } from '@/lib/api-response'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 3600 // Revalidate every hour

// Convert provider name to slug
function providerNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  try {
    const currency = process.env.CASINO_DEFAULT_CURRENCY || 'USD'
    const providers = await getCachedData(
      `providers-filtered-${currency}`,
      async () => {
        // Fetch games from Slotegrator API
        // Fetch 30 pages (1500 games) to ensure we capture all unique providers
        // This ensures providers are tailored to your game library
        const gamesResponse = await getGames({ 
          fetchAll: false,
          maxPages: 30 // 30 pages = ~1500 games to get all unique providers
        })

        // Get enabled providers from the merchant's Slotegrator contract
        // This ensures we only show providers whose games can actually be launched
        const enabledProvidersSet = await getEnabledProviders(currency)
        const hasEnabledList = enabledProvidersSet.size > 0

        // Extract unique providers from YOUR actual games, filtered by enabled providers
        const providerMap = new Map<string, { id: string; name: string; slug: string; count: number }>()
        
        gamesResponse.items.forEach(game => {
          // Skip games from providers not enabled in the contract
          if (hasEnabledList) {
            const isEnabled = Array.from(enabledProvidersSet).some(
              ep => ep.toLowerCase() === game.provider.trim().toLowerCase()
            )
            if (!isEnabled) return
          }

          if (providerMap.has(game.provider)) {
            // Increment count for this provider
            const existing = providerMap.get(game.provider)!
            existing.count++
          } else {
            const slug = providerNameToSlug(game.provider)
            providerMap.set(game.provider, {
              id: slug, // Use slug as id
              name: game.provider,
              slug: slug,
              count: 1
            })
          }
        })

        // Filter out providers with very few games (less than 3) to keep it relevant
        // This ensures only providers with meaningful game counts are shown
        const filteredProviders = Array.from(providerMap.values())
          .filter(provider => provider.count >= 3) // Only show providers with at least 3 games

        // Sort by game count (descending) then by name
        // This puts providers with more games first
        const sorted = filteredProviders.sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count // Sort by count descending
          }
          return a.name.localeCompare(b.name) // Then by name
        })

        // Remove count from final result (not needed in response)
        return sorted.map(({ count, ...rest }) => rest)
      },
      3600000 // 1 hour TTL
    )

    // Return format expected by frontend with aggressive caching headers
    return NextResponse.json(
      { providers },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400, max-age=3600', // Cache for 2 hours server-side, 1 hour client-side
          'CDN-Cache-Control': 'public, s-maxage=7200',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching providers:', error)
    return errorResponse(error)
  }
}








