import { query, queryOne, exec } from './db'
import { nanoid } from 'nanoid'

/**
 * Phase 2A — Database Migration
 * Run once on server startup to create bonus system tables.
 * Uses IF NOT EXISTS so it is idempotent.
 */
export function runBonusMigrations(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS user_bonuses (
      id                   TEXT PRIMARY KEY,
      user_id              TEXT NOT NULL,
      bonus_type           TEXT NOT NULL CHECK(bonus_type IN ('welcome','cashback','bet_and_get')),
      status               TEXT NOT NULL DEFAULT 'active'
                           CHECK(status IN ('active','completed','expired','forfeited')),
      bonus_amount         REAL NOT NULL,
      wagering_requirement REAL NOT NULL,
      wagering_progress    REAL NOT NULL DEFAULT 0,
      max_bet_limit        REAL,
      funded_by            TEXT NOT NULL DEFAULT 'bonus',
      expires_at           TEXT NOT NULL,
      completed_at         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  exec(`
    CREATE TABLE IF NOT EXISTS free_spin_batches (
      id            TEXT PRIMARY KEY,
      user_bonus_id TEXT NOT NULL REFERENCES user_bonuses(id),
      game_id       TEXT NOT NULL,
      total_spins   INTEGER NOT NULL,
      spins_used    INTEGER NOT NULL DEFAULT 0,
      release_date  TEXT NOT NULL,
      expires_at    TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  exec(`
    CREATE TABLE IF NOT EXISTS bonus_wagering_contributions (
      id                  TEXT PRIMARY KEY,
      user_bonus_id       TEXT NOT NULL REFERENCES user_bonuses(id),
      bet_id              TEXT,
      game_session_id     TEXT,
      game_type           TEXT NOT NULL CHECK(game_type IN ('slot','table','sports')),
      bet_amount          REAL NOT NULL,
      contribution_rate   REAL NOT NULL,
      contribution_amount REAL NOT NULL,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  exec(`
    CREATE TABLE IF NOT EXISTS bonus_fingerprints (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      bonus_type       TEXT NOT NULL,
      fingerprint_hash TEXT NOT NULL,
      ip_address       TEXT,
      awarded_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(bonus_type, fingerprint_hash)
    )
  `)

  exec(`
    CREATE TABLE IF NOT EXISTS suspicious_account_links (
      id              TEXT PRIMARY KEY,
      user_id_a       TEXT NOT NULL,
      user_id_b       TEXT NOT NULL,
      link_type       TEXT NOT NULL CHECK(link_type IN ('ip','payment_method','device','fingerprint')),
      link_value      TEXT NOT NULL,
      detected_at     TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed        INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id_a, user_id_b, link_type)
    )
  `)

  exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by TEXT
    )
  `)

  // Seed platform settings if empty
  exec(`
    INSERT OR IGNORE INTO platform_settings (key, value) VALUES
      ('site_name',             'Shartbandee'),
      ('site_url',              'https://shartbandee.com'),
      ('maintenance_mode',      'false'),
      ('registration_enabled',  'true'),
      ('min_deposit',           '20'),
      ('max_deposit',           '100000'),
      ('min_withdrawal',        '20'),
      ('max_withdrawal',        '50000'),
      ('default_currency',      'EUR'),
      ('default_language',      'fr'),
      ('timezone',              'Africa/Casablanca')
  `)

  console.log('[DB] Bonus system migrations applied.')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function getActiveBonus(
  userId: string,
  bonusType?: string
): Promise<any | null> {
  const now = new Date().toISOString()
  if (bonusType) {
    return queryOne(
      `SELECT * FROM user_bonuses
       WHERE user_id = ? AND bonus_type = ? AND status = 'active' AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`,
      [userId, bonusType, now]
    )
  }
  return queryOne(
    `SELECT * FROM user_bonuses
     WHERE user_id = ? AND status = 'active' AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    [userId, now]
  )
}

export async function getAllActiveBonuses(userId: string): Promise<any[]> {
  const now = new Date().toISOString()
  const result = await query(
    `SELECT * FROM user_bonuses
     WHERE user_id = ? AND status = 'active' AND expires_at > ?
     ORDER BY created_at DESC`,
    [userId, now]
  )
  return result.rows
}

export async function hasFingerprintClaimed(
  bonusType: string,
  fingerprintHash: string
): Promise<boolean> {
  const row = await queryOne(
    `SELECT id FROM bonus_fingerprints WHERE bonus_type = ? AND fingerprint_hash = ?`,
    [bonusType, fingerprintHash]
  )
  return !!row
}

export async function recordFingerprintClaim(
  userId: string,
  bonusType: string,
  fingerprintHash: string,
  ip: string | null
): Promise<void> {
  await query(
    `INSERT OR IGNORE INTO bonus_fingerprints (id, user_id, bonus_type, fingerprint_hash, ip_address)
     VALUES (?, ?, ?, ?, ?)`,
    [nanoid(), userId, bonusType, fingerprintHash, ip]
  )
}

export async function updateWageringProgress(
  bonusBetId: string,
  contribution: number
): Promise<void> {
  await query(
    `UPDATE user_bonuses
     SET wagering_progress = wagering_progress + ?
     WHERE id = ?`,
    [contribution, bonusBetId]
  )
  // Check if completed
  const bonus: any = await queryOne(
    `SELECT * FROM user_bonuses WHERE id = ?`,
    [bonusBetId]
  )
  if (bonus && bonus.wagering_progress >= bonus.wagering_requirement && bonus.status === 'active') {
    await query(
      `UPDATE user_bonuses SET status = 'completed', completed_at = ? WHERE id = ?`,
      [new Date().toISOString(), bonusBetId]
    )
    // Convert bonus_balance to real balance
    await query(
      `UPDATE wallets
       SET balance = balance + (SELECT COALESCE(bonus_balance,0) FROM wallets WHERE user_id = ?),
           bonus_balance = 0
       WHERE user_id = ?`,
      [bonus.user_id, bonus.user_id]
    )
  }
}
