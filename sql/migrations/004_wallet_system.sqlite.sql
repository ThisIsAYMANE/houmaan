-- Migration: Wallet System & Transaction Infrastructure
-- Phase 1: Foundation & Core Infrastructure

-- ============================================
-- Transaction Types Enum (stored as TEXT with CHECK constraint)
-- ============================================
-- We'll use TEXT with CHECK constraints since SQLite doesn't have native ENUMs

-- ============================================
-- Wallet Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN (
    'deposit',           -- Bitcoin deposit
    'withdrawal',        -- Withdrawal request
    'bet_placed',        -- Bet placed (sports/casino)
    'bet_won',           -- Bet won
    'bet_lost',          -- Bet lost
    'bet_cancelled',     -- Bet cancelled/voided
    'casino_spin',       -- Casino game spin/wager
    'casino_win',        -- Casino game win
    'bonus_credited',    -- Bonus credited
    'bonus_used',        -- Bonus used
    'refund',            -- Refund issued
    'adjustment'         -- Manual adjustment
  )),
  amount DECIMAL(18, 8) NOT NULL,  -- Amount (can be negative for withdrawals/bets)
  balance_before DECIMAL(18, 8) NOT NULL,  -- Balance before transaction
  balance_after DECIMAL(18, 8) NOT NULL,   -- Balance after transaction
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'reversed'
  )),
  description TEXT,
  reference_id TEXT,  -- Reference to related entity (bet_id, payment_id, etc.)
  reference_type TEXT,  -- Type of reference (bet, payment, game, etc.)
  metadata TEXT,  -- JSON metadata for additional info
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id);

-- ============================================
-- Deposits Table (Bitcoin Payments) - Enhanced
-- ============================================
-- Note: The deposits table already exists from initial schema (001_initial_schema.sqlite.sql)
-- It has: id, user_id, amount, currency, method, network, address, tx_hash, status, bonus_amount, bonus_id, created_at, updated_at
-- 
-- We'll add Bitcoin-specific columns in Phase 2 when implementing Bitcoin payments
-- For Phase 1, we'll use the existing deposits table structure
-- The wallet_transactions table will handle all transaction tracking

-- ============================================
-- Withdrawals Table
-- ============================================
-- Note: The withdrawals table already exists from initial schema (001_initial_schema.sqlite.sql)
-- It has: id, user_id, amount, currency, method, network, address, tx_hash, status, processing_time, fee, created_at, updated_at
-- 
-- We'll enhance it in Phase 2 if needed for Bitcoin-specific features
-- For Phase 1, we'll use the existing withdrawals table structure
-- No need to recreate or modify withdrawals table here

-- ============================================
-- Bonus Balances Table
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_balances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL CHECK(bonus_type IN (
    'welcome_bonus',
    'deposit_bonus',
    'free_spins',
    'cashback',
    'referral_bonus',
    'promotional'
  )),
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MAD',
  wagering_requirement DECIMAL(18, 8) DEFAULT 0,  -- Amount that must be wagered
  wagered_amount DECIMAL(18, 8) DEFAULT 0,  -- Amount already wagered
  expires_at TIMESTAMP,  -- Bonus expiration date
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN (
    'active',
    'used',
    'expired',
    'cancelled'
  )),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bonus_balances_user_id ON bonus_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_balances_status ON bonus_balances(status);
CREATE INDEX IF NOT EXISTS idx_bonus_balances_expires_at ON bonus_balances(expires_at);

-- ============================================
-- Update existing wallets table to support bonus balance
-- ============================================
-- Note: The wallets table already exists, we just need to add bonus_balance column
-- SQLite doesn't support adding columns with DEFAULT in some versions, so we'll add it and update existing rows

-- Add bonus_balance column if it doesn't exist (we'll handle this in application if needed)
-- For now, we'll try to add it and ignore errors if it exists
-- In practice, we'll check in the application code

-- Note: Since SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN,
-- we'll add the column and handle errors gracefully in the migration script
-- or check if column exists before adding

-- Add bonus_balance column
-- This will fail if column already exists, which is fine - we'll handle it in the app

-- ============================================
-- Transaction Reconciliation Table
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_reconciliation (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id) ON DELETE CASCADE,
  expected_amount DECIMAL(18, 8) NOT NULL,
  actual_amount DECIMAL(18, 8) NOT NULL,
  difference DECIMAL(18, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending',
    'resolved',
    'flagged'
  )),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_transaction_id ON transaction_reconciliation(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_status ON transaction_reconciliation(status);

