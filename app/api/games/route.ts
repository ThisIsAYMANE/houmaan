import { NextRequest, NextResponse } from 'next/server'
import { getGames, Game as SlotegratorGame, getEnabledProviders } from '@/lib/casino-api'
import { mapTypeToCategorySlug } from '@/lib/category-mapping'
import { getCachedData } from '@/lib/api-cache'

// Next.js route segment config for caching
export const revalidate = 300 // Revalidate every 5 minutes (games change more frequently)
export const dynamic = 'force-dynamic' // Games need dynamic fetching based on filters

// Convert provider name to slug
function providerNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Map Slotegrator game format to our Game format
function mapSlotegratorGameToGame(slotegratorGame: SlotegratorGame) {
  const categorySlug = mapTypeToCategorySlug(slotegratorGame.type)
  const providerSlug = providerNameToSlug(slotegratorGame.provider)

  // Use high-quality image from images array if available, otherwise use default image
  let thumbnailUrl = slotegratorGame.image
  if (slotegratorGame.images && slotegratorGame.images.length > 0) {
    // Prefer regular type image, fallback to first available
    const regularImage = slotegratorGame.images.find(img => img.type === 'regular')
    thumbnailUrl = regularImage?.url || slotegratorGame.images[0].url || slotegratorGame.image
  }

  return {
    id: slotegratorGame.uuid,
    title: slotegratorGame.name,
    slug: slotegratorGame.uuid, // Use UUID as slug
    description: null,
    thumbnail_url: thumbnailUrl,
    game_url: null, // Will be set when launching game
    is_active: 1,
    is_featured: 0,
    is_new: 0,
    is_exclusive: 0,
    is_original: 0,
    has_buy_in: 0,
    is_burst: 0,
    multiplier: null,
    player_count: 0,
    popularity: 0,
    created_at: null,
    provider_name: slotegratorGame.provider,
    provider_slug: providerSlug,
    provider_logo: null,
    category_name: slotegratorGame.type,
    category_slug: categorySlug,
    // Additional Slotegrator fields
    uuid: slotegratorGame.uuid,
    type: slotegratorGame.type,
    provider_id: slotegratorGame.provider_id,
    technology: slotegratorGame.technology,
    has_lobby: slotegratorGame.has_lobby,
    is_mobile: slotegratorGame.is_mobile,
    has_freespins: slotegratorGame.has_freespins,
    has_tables: slotegratorGame.has_tables,
    freespin_valid_until_full_day: slotegratorGame.freespin_valid_until_full_day,
    label: slotegratorGame.label,
    updated_at: (slotegratorGame as any).updated_at, // Not in interface but present in API response
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const provider = searchParams.get('provider')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '500') // Default limit
    const isLobby = !category || category === 'lobby' // Check if this is for lobby view

    // Calculate how many pages we need based on the limit
    // Slotegrator returns 50 games per page
    const gamesPerPage = 50
    const pagesNeeded = Math.ceil(limit / gamesPerPage)
    
    // For lobby view, we need to fetch significantly more games to ensure
    // we have enough games for each category carousel
    // For specific category/provider filters, we can fetch fewer pages
    let maxPagesToFetch: number
    if (isLobby && !provider) {
      // Lobby needs games for all categories - fetch more pages to ensure variety
      // Fetch 40 pages (2000 games) to have enough games for each category
      maxPagesToFetch = 40
      console.log(`Fetching ${maxPagesToFetch} pages for lobby view (need games for all categories)`)
    } else if (category || provider) {
      // Filtered view - fetch with buffer for filtering
      const bufferPages = Math.min(Math.ceil(pagesNeeded * 1.5), 20)
      maxPagesToFetch = Math.min(bufferPages, 20) // Cap at 20 pages max (1000 games)
      console.log(`Fetching ${maxPagesToFetch} pages for limit=${limit} (${pagesNeeded} pages needed + buffer)`)
    } else {
      // Default case
      maxPagesToFetch = Math.min(pagesNeeded, 20)
      console.log(`Fetching ${maxPagesToFetch} pages for limit=${limit}`)
    }
    
    const gamesResponse = await getGames({
      expand: 'images', // Get high-quality images if available
      fetchAll: false, // Only fetch what we need
      maxPages: maxPagesToFetch,
    })

    // Get enabled providers for the default currency (USD)
    // This filters out games from providers that aren't enabled in the contract
    const enabledProviders = await getCachedData(
      'enabled-providers',
      async () => {
        const providers = await getEnabledProviders('USD')
        return Array.from(providers)
      },
      3600000 // Cache for 1 hour
    )
    const enabledProvidersSet = new Set(enabledProviders)

    // Map Slotegrator games to our format and filter by enabled providers
    // Use case-insensitive matching for provider names
    let games = gamesResponse.items
      .filter(game => {
        // Only include games from enabled providers
        // If we can't determine enabled providers (empty set), show all games (fallback)
        if (enabledProvidersSet.size === 0) {
          console.warn(`[Provider Filter] No enabled providers found - showing all games (fallback mode)`)
          return true // Fallback: show all games if we can't determine enabled providers
        }
        
        // Case-insensitive provider matching
        const gameProvider = game.provider.trim()
        const isEnabled = Array.from(enabledProvidersSet).some(
          enabledProvider => enabledProvider.toLowerCase() === gameProvider.toLowerCase()
        )
        
        if (!isEnabled) {
          console.debug(`[Provider Filter] Filtering out game "${game.name}" from provider "${gameProvider}" (not in enabled list)`)
        }
        
        return isEnabled
      })
      .map(mapSlotegratorGameToGame)
    
    // Log filtering info
    if (enabledProvidersSet.size > 0) {
      const filteredCount = gamesResponse.items.length - games.length
      if (filteredCount > 0) {
        console.log(`[Provider Filter] Filtered out ${filteredCount} games from disabled providers. Showing ${games.length} games from ${enabledProvidersSet.size} enabled providers.`)
      } else {
        console.log(`[Provider Filter] All ${games.length} games are from enabled providers.`)
      }
    } else {
      console.warn(`[Provider Filter] WARNING: Could not determine enabled providers - showing all ${games.length} games. This may cause "provider not enabled" errors.`)
    }

    // Apply filters
    if (category && category !== 'lobby') {
      games = games.filter(game => game.category_slug === category)
    }

    if (provider) {
      games = games.filter(game => game.provider_slug === provider)
    }

    if (featured === 'true') {
      // For now, we don't have featured flag from Slotegrator
      // You can add logic here if needed
    }

    // Apply limit
    const limitedGames = games.slice(0, limit)

    return NextResponse.json({
      games: limitedGames,
      total: games.length,
      limit,
      offset: 0
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}











