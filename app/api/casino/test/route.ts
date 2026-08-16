import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getCasinoConfig, calculateXSign } from '@/lib/casino-api'

/**
 * GET /api/casino/test
 *
 * Diagnostic endpoint — reports config status and calls Slotegrator /self-validate.
 * Use this in dev to confirm merchant credentials work and the IP is whitelisted.
 */
export async function GET(_req: NextRequest) {
  const merchantId = process.env.CASINO_MERCHANT_ID
  const merchantKey = process.env.CASINO_MERCHANT_KEY
  const baseUrl = process.env.CASINO_API_BASE_URL

  const configStatus = {
    CASINO_MERCHANT_ID: merchantId
      ? merchantId === 'your-merchant-id'
        ? '⚠️  placeholder — replace with real ID'
        : '✅ set'
      : '❌ missing',
    CASINO_MERCHANT_KEY: merchantKey ? '✅ set' : '❌ missing',
    CASINO_API_BASE_URL: baseUrl ? `✅ ${baseUrl}` : '❌ missing',
  }

  const allConfigured = !!(
    merchantId &&
    merchantKey &&
    baseUrl &&
    merchantId !== 'your-merchant-id'
  )

  if (!allConfigured) {
    return NextResponse.json({
      success: false,
      configured: false,
      configStatus,
      message:
        'Cannot run self-validate: one or more required environment variables are missing or are still placeholder values.',
      instructions: [
        '1. Set CASINO_MERCHANT_ID to your real Slotegrator Merchant ID',
        '2. Set CASINO_MERCHANT_KEY to your Slotegrator Merchant Key',
        '3. Set CASINO_API_BASE_URL to the Slotegrator GIS API base URL',
        '4. Restart the dev server, then call GET /api/casino/test again',
      ],
    })
  }

  // All credentials present — call Slotegrator /self-validate
  try {
    const config = getCasinoConfig()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomBytes(16).toString('hex')

    const authHeaders: Record<string, string> = {
      'X-Merchant-Id': config.merchantId,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    }

    const xSign = calculateXSign({}, authHeaders, config.merchantKey)

    const response = await fetch(`${config.baseUrl}/self-validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Merchant-Id': config.merchantId,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Sign': xSign,
      },
    })

    const rawText = await response.text()
    let responseData: any
    try {
      responseData = JSON.parse(rawText)
    } catch {
      responseData = { raw: rawText }
    }

    const isSuccess = response.ok && responseData?.status === 'ok'

    return NextResponse.json({
      success: isSuccess,
      configured: true,
      configStatus,
      httpStatus: response.status,
      slotegratorResponse: responseData,
      diagnosis: isSuccess
        ? '✅ Slotegrator credentials are valid and your server IP is whitelisted.'
        : response.status === 403
        ? '❌ HTTP 403 — Your server IP is NOT whitelisted in Slotegrator. Contact Slotegrator support to whitelist your IP.'
        : response.status === 401
        ? '❌ HTTP 401 — Invalid credentials. Check CASINO_MERCHANT_ID and CASINO_MERCHANT_KEY.'
        : `⚠️  Unexpected response (HTTP ${response.status}). See slotegratorResponse for details.`,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      configured: true,
      configStatus,
      error: error?.message ?? 'Unknown error',
      diagnosis:
        'Network error calling Slotegrator. Check CASINO_API_BASE_URL and that the server has outbound internet access.',
    })
  }
}
