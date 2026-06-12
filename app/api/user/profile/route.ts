import { NextRequest } from 'next/server'
import { getSession, getUserById, getUserProfile } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/errors'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      throw new UnauthorizedError('No session token provided')
    }

    // Get session
    const session = await getSession(sessionToken)
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session')
    }

    // Get user
    const user = await getUserById(session.userId)
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive')
    }

    // Get profile
    const profile = await getUserProfile(session.userId)

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        vipLevel: user.vip_level,
        createdAt: user.created_at,
      },
      profile: profile
        ? {
            firstName: profile.first_name,
            lastName: profile.last_name,
            language: profile.language,
            currency: profile.currency,
            theme: profile.theme,
            totalWinnings: Number(profile.total_winnings),
            totalBets: profile.total_bets,
            totalWagers: Number(profile.total_wagers),
          }
        : null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PUT /api/user/profile
 * Update user profile (currency, language, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      throw new UnauthorizedError('No session token provided')
    }

    // Get session
    const session = await getSession(sessionToken)
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session')
    }

    const body = await request.json()
    const { currency, language, theme } = body

    // Validate currency if provided
    const validCurrencies = ['USD', 'EUR', 'GBP', 'EUR', 'BTC', 'ETH']
    if (currency && !validCurrencies.includes(currency)) {
      return errorResponse(new Error(`Invalid currency. Must be one of: ${validCurrencies.join(', ')}`), 400)
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (currency !== undefined) {
      updates.push('currency = ?')
      values.push(currency)
    }

    if (language !== undefined) {
      updates.push('language = ?')
      values.push(language)
    }

    if (theme !== undefined) {
      updates.push('theme = ?')
      values.push(theme)
    }

    if (updates.length === 0) {
      return errorResponse(new Error('No fields to update'), 400)
    }

    // Add user_id for WHERE clause
    values.push(session.userId)

    // Update profile
    await query(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    )

    // Also update wallet currency if currency changed
    if (currency) {
      await query(
        'UPDATE wallets SET currency = ? WHERE user_id = ?',
        [currency, session.userId]
      )
    }

    // Get updated profile
    const updatedProfile = await getUserProfile(session.userId)

    return successResponse({
      message: 'Profile updated successfully',
      profile: updatedProfile
        ? {
            firstName: updatedProfile.first_name,
            lastName: updatedProfile.last_name,
            language: updatedProfile.language,
            currency: updatedProfile.currency,
            theme: updatedProfile.theme,
          }
        : null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
















