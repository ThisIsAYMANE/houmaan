import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { runBonusMigrations, hasFingerprintClaimed, recordFingerprintClaim } from '@/lib/bonus-db'
import { isBonusEligibilityFrozen } from '@/lib/fraud-detection'

// Ensure tables exist
try { runBonusMigrations() } catch {}

const WELCOME_BONUS_RATE = 1.0          // 100% match
const WELCOME_BONUS_MAX = 100.00        // $100 cap
const WELCOME_MIN_DEPOSIT = 20.00       // $20 minimum
const WELCOME_WAGERING = 35             // 35× on bonus amount
const WELCOME_MAX_BET = 5.00           // $5 max per spin while active
const WELCOME_EXPIRY_DAYS = 7
const FREE_SPINS_TOTAL = 50
const FREE_SPINS_PER_DAY = 10
const FREE_SPIN_GAME_ID = 'featured_slot' // replace with actual Slotegrator game ID

/**
 * POST /api/bonuses/welcome/claim
 *
 * Called after a qualifying first deposit is detected.
 * Verifies: first deposit, amount ≥ $20, fingerprint not already used, no fraud freeze.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)

    // Resolve user from session token
    const session = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM sessions WHERE session_token = ? AND expires > CURRENT_TIMESTAMP`,
      [token]
    )
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    const userId = session.user_id

    const body = await request.json()
    const { depositAmount, deviceFingerprint } = body

    if (!depositAmount || depositAmount < WELCOME_MIN_DEPOSIT) {
      return NextResponse.json(
        { error: `Dépôt minimum requis : $${WELCOME_MIN_DEPOSIT}` },
        { status: 400 }
      )
    }

    // Check fraud freeze
    if (await isBonusEligibilityFrozen(userId)) {
      return NextResponse.json(
        { error: 'Éligibilité au bonus suspendue. Contactez le support.' },
        { status: 403 }
      )
    }

    // Check: first deposit only
    const depositCount = await queryOne<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM transactions
       WHERE user_id = ? AND type = 'deposit' AND status = 'completed'`,
      [userId]
    )
    if ((depositCount?.cnt ?? 0) > 1) {
      return NextResponse.json(
        { error: 'Le bonus de bienvenue est réservé au premier dépôt.' },
        { status: 400 }
      )
    }

    // Check: welcome bonus not already claimed
    const existing = await queryOne(
      `SELECT id FROM user_bonuses WHERE user_id = ? AND bonus_type = 'welcome' LIMIT 1`,
      [userId]
    )
    if (existing) {
      return NextResponse.json(
        { error: 'Bonus de bienvenue déjà réclamé.' },
        { status: 400 }
      )
    }

    // Fingerprint check — SHA256(userId + deviceFingerprint)
    const fingerprintRaw = `${userId}:${deviceFingerprint ?? 'unknown'}`
    const fingerprintHash = crypto.createHash('sha256').update(fingerprintRaw).digest('hex')

    if (await hasFingerprintClaimed('welcome', fingerprintHash)) {
      return NextResponse.json(
        { error: 'Ce dispositif a déjà réclamé un bonus de bienvenue.' },
        { status: 400 }
      )
    }

    // Calculate bonus amount
    const bonusAmount = Math.min(depositAmount * WELCOME_BONUS_RATE, WELCOME_BONUS_MAX)
    const wageringRequirement = bonusAmount * WELCOME_WAGERING
    const expiresAt = new Date(Date.now() + WELCOME_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const bonusId = nanoid()

    // Insert bonus record
    await query(
      `INSERT INTO user_bonuses
         (id, user_id, bonus_type, status, bonus_amount, wagering_requirement, wagering_progress, max_bet_limit, expires_at)
       VALUES (?, ?, 'welcome', 'active', ?, ?, 0, ?, ?)`,
      [bonusId, userId, bonusAmount, wageringRequirement, WELCOME_MAX_BET, expiresAt.toISOString()]
    )

    // Schedule 5 daily free spin batches (10/day)
    for (let day = 0; day < 5; day++) {
      const releaseDate = new Date()
      releaseDate.setUTCDate(releaseDate.getUTCDate() + day)
      releaseDate.setUTCHours(0, 0, 0, 0)

      const spinExpiry = new Date(releaseDate.getTime() + 48 * 60 * 60 * 1000)

      await query(
        `INSERT INTO free_spin_batches
           (id, user_bonus_id, game_id, total_spins, spins_used, release_date, expires_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [nanoid(), bonusId, FREE_SPIN_GAME_ID, FREE_SPINS_PER_DAY,
         releaseDate.toISOString().split('T')[0], spinExpiry.toISOString()]
      )
    }

    // Credit bonus_balance in wallet
    await query(
      `UPDATE wallets SET bonus_balance = COALESCE(bonus_balance,0) + ? WHERE user_id = ?`,
      [bonusAmount, userId]
    )

    // Record fingerprint
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? null
    await recordFingerprintClaim(userId, 'welcome', fingerprintHash, ip)

    return NextResponse.json({
      success: true,
      bonusId,
      bonusAmount,
      wageringRequirement,
      maxBetLimit: WELCOME_MAX_BET,
      freeSpins: FREE_SPINS_TOTAL,
      expiresAt: expiresAt.toISOString(),
      message: `Bonus de bienvenue de $${bonusAmount.toFixed(2)} crédité ! Mise requise : ${WELCOME_WAGERING}× ($${wageringRequirement.toFixed(2)}). Mise max pendant le bonus : $${WELCOME_MAX_BET}.`,
    })
  } catch (error: any) {
    console.error('Welcome bonus claim error:', error)
    return NextResponse.json({ error: error.message ?? 'Erreur interne' }, { status: 500 })
  }
}
