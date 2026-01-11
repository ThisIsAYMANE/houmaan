import { NextRequest, NextResponse } from 'next/server'
import { getGames, Game as SlotegratorGame } from '@/lib/casino-api'
import { mapTypeToCategorySlug } from '@/lib/category-mapping'

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

  // Use high-quality image from images array if available
  let thumbnailUrl = slotegratorGame.image
  if (slotegratorGame.images && slotegratorGame.images.length > 0) {
    const regularImage = slotegratorGame.images.find(img => img.type === 'regular')
    thumbnailUrl = regularImage?.url || slotegratorGame.images[0].url || slotegratorGame.image
  }

  return {
    id: slotegratorGame.uuid,
    title: slotegratorGame.name,
    slug: slotegratorGame.uuid,
    description: null,
    thumbnail_url: thumbnailUrl,
    game_url: null,
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
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 3) {
      return NextResponse.json({
        games: [],
        total: 0,
        message: 'Search query must be at least 3 characters'
      })
    }

    // Fetch games from Slotegrator API
    const gamesResponse = await getGames({
      expand: 'images',
    })

    // Map Slotegrator games to our format
    let games = gamesResponse.items.map(mapSlotegratorGameToGame)

    // Search in game name and provider name (case-insensitive)
    const searchLower = q.toLowerCase()
    games = games.filter(game => 
      game.title.toLowerCase().includes(searchLower) ||
      game.provider_name.toLowerCase().includes(searchLower)
    )

    // Sort: exact title match first, then title starts with query, then others
    games.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      const queryLower = searchLower

      if (aTitle === queryLower && bTitle !== queryLower) return -1
      if (aTitle !== queryLower && bTitle === queryLower) return 1
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1
      if (!aTitle.startsWith(queryLower) && bTitle.startsWith(queryLower)) return 1
      return 0
    })

    // Limit results
    const limitedGames = games.slice(0, 50)

    return NextResponse.json({
      games: limitedGames,
      total: games.length,
      query: q
    })
  } catch (error) {
    console.error('Error searching games:', error)
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}











