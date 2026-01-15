import { NextRequest, NextResponse } from 'next/server'
import { getGames, getMerchantLimits } from '@/lib/casino-api'
import { queryOne } from '@/lib/db'

/**
 * GET /api/games/find-working
 * 
 * Finds a game that can be launched without errors
 * Checks provider enablement for user's currency
 * 
 * Query params:
 * - userId: Optional user ID to check their currency
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Get user's currency
    let currency = 'EUR' // Default to EUR since that's what's enabled
    if (userId) {
      const profile = await queryOne<{ currency: string }>(
        'SELECT currency FROM user_profiles WHERE user_id = ?',
        [userId]
      )
      currency = profile?.currency || 'EUR'
    }

    // Get enabled providers for the currency
    const limits = await getMerchantLimits()
    const currencyLimit = limits.find(l => l.currency === currency)
    
    if (!currencyLimit) {
      return NextResponse.json({
        success: false,
        error: `No providers enabled for currency ${currency}`,
        availableCurrencies: limits.map(l => l.currency),
        suggestion: 'Try using EUR currency'
      }, { status: 400 })
    }

    const enabledProviders = currencyLimit.providers || []

    // Get games from first few pages
    const gamesResponse = await getGames({
      fetchAll: false,
      maxPages: 5, // Check first 5 pages
    })

    // Find games from enabled providers (prefer games without lobby)
    const workingGames = gamesResponse.items
      .filter(game => 
        enabledProviders.includes(game.provider) && 
        game.has_lobby === 0 // Prefer games without lobby
      )
      .slice(0, 10) // Return first 10

    if (workingGames.length === 0) {
      // Fallback: include games with lobby
      const allWorkingGames = gamesResponse.items
        .filter(game => enabledProviders.includes(game.provider))
        .slice(0, 10)

      return NextResponse.json({
        success: true,
        currency,
        enabledProviders: enabledProviders.slice(0, 10),
        games: allWorkingGames.map(game => ({
          uuid: game.uuid,
          name: game.name,
          provider: game.provider,
          type: game.type,
          has_lobby: game.has_lobby,
          url: `/games/${game.uuid}`
        })),
        message: 'Found games (some may require lobby)',
        note: `Make sure your user profile has currency set to: ${currency}`
      })
    }

    return NextResponse.json({
      success: true,
      currency,
      enabledProviders: enabledProviders.slice(0, 10),
      games: workingGames.map(game => ({
        uuid: game.uuid,
        name: game.name,
        provider: game.provider,
        type: game.type,
        has_lobby: game.has_lobby,
        url: `/games/${game.uuid}`
      })),
      recommended: {
        uuid: workingGames[0].uuid,
        name: workingGames[0].name,
        provider: workingGames[0].provider,
        url: `/games/${workingGames[0].uuid}`
      },
      note: `Make sure your user profile has currency set to: ${currency}`
    })
  } catch (error) {
    console.error('Error finding working game:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

