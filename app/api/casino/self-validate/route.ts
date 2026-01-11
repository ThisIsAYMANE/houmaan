import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { selfValidate } from '@/lib/casino-api'

/**
 * POST /api/casino/self-validate
 * 
 * Self-validation endpoint for Casino API integration
 * 
 * This endpoint:
 * 1. Checks for an active game session (opened within 15 minutes)
 * 2. Calls the Casino API self-validation endpoint
 * 3. Returns validation results with log messages
 * 
 * Requirements:
 * - Active game session must exist (opened within 15 minutes)
 * - Casino API credentials must be configured
 */
export async function POST(request: NextRequest) {
  try {
    // Check for active game session (opened within 15 minutes)
    // The session_token in game_sessions should match a session from the Casino API
    const activeSession = await queryOne<{
      id: string
      user_id: string
      game_id: string
      session_token: string
      started_at: string
    }>(
      `SELECT id, user_id, game_id, session_token, started_at 
       FROM game_sessions 
       WHERE started_at > datetime('now', '-15 minutes')
       ORDER BY started_at DESC 
       LIMIT 1`
    )

    if (!activeSession) {
      return NextResponse.json(
        {
          success: false,
          log: [
            'No active game session found',
            'Please launch a game first and ensure the session was opened within the last 15 minutes',
          ],
        },
        { status: 400 }
      )
    }

    // Call Casino API self-validation
    try {
      const validationResult = await selfValidate()

      return NextResponse.json({
        success: validationResult.success,
        log: [
          `Active session found: ${activeSession.id}`,
          `Game ID: ${activeSession.game_id}`,
          `Session started: ${activeSession.started_at}`,
          ...validationResult.log,
        ],
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      return NextResponse.json(
        {
          success: false,
          log: [
            `Active session found: ${activeSession.id}`,
            `Game ID: ${activeSession.game_id}`,
            `Session started: ${activeSession.started_at}`,
            `Self-validation failed: ${errorMessage}`,
            'Please check your Casino API credentials and configuration',
          ],
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Self-validation route error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        log: [
          `Error during self-validation: ${errorMessage}`,
          'Please check your database connection and configuration',
        ],
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/casino/self-validate
 * 
 * Get information about self-validation requirements
 */
export async function GET(request: NextRequest) {
  try {
    let activeSession = null
    let hasActiveSession = false

    // Try to check for active game session (table might not exist yet)
    try {
      const session = await queryOne<{
        id: string
        user_id: string
        game_id: string
        session_token: string
        started_at: string
      }>(
        `SELECT id, user_id, game_id, session_token, started_at 
         FROM game_sessions 
         WHERE started_at > datetime('now', '-15 minutes')
         ORDER BY started_at DESC 
         LIMIT 1`
      )
      activeSession = session
      hasActiveSession = !!session
    } catch (dbError) {
      // Table might not exist yet, that's okay
      console.log('game_sessions table check:', dbError instanceof Error ? dbError.message : 'Unknown error')
      hasActiveSession = false
    }

    // Check if Casino API is configured
    const merchantId = process.env.CASINO_MERCHANT_ID
    const merchantKey = process.env.CASINO_MERCHANT_KEY
    const baseUrl = process.env.CASINO_API_BASE_URL

    const isConfigured = !!(merchantId && merchantKey && baseUrl)
    
    // Check if Merchant ID is still the placeholder
    const hasRealMerchantId = merchantId && merchantId !== 'your-merchant-id'

    return NextResponse.json({
      ready: hasActiveSession && isConfigured && hasRealMerchantId,
      hasActiveSession,
      isConfigured,
      hasRealMerchantId,
      configuration: {
        merchantId: merchantId ? (hasRealMerchantId ? '***configured***' : '⚠️ placeholder value') : '❌ missing',
        merchantKey: merchantKey ? '***configured***' : '❌ missing',
        baseUrl: baseUrl ? '***configured***' : '❌ missing',
      },
      activeSession: activeSession
        ? {
            id: activeSession.id,
            gameId: activeSession.game_id,
            startedAt: activeSession.started_at,
          }
        : null,
      requirements: {
        activeGameSession: 'A game session opened within the last 15 minutes',
        casinoApiCredentials:
          'CASINO_MERCHANT_ID, CASINO_MERCHANT_KEY, and CASINO_API_BASE_URL must be set',
        merchantId: 'You need to replace "your-merchant-id" with your actual Merchant ID from Slotegrator',
      },
    })
  } catch (error) {
    console.error('Self-validation info error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to get self-validation information',
        details: errorMessage,
        message: 'Check server logs for more details'
      },
      { status: 500 }
    )
  }
}

