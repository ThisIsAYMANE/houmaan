-- Migration: USDT Payment System (EVM - ERC-20 / BEP-20)
-- Adds USDT deposit tracking tables mirroring the Bitcoin payment system

-- ============================================
-- USDT Address Tracking Table
-- Each user gets a unique EVM address for each USDT deposit
-- Compatible with: Ethereum (ERC-20), BSC (BEP-20), Polygon (Polygon-USDT)
-- ============================================
CREATE TABLE IF NOT EXISTS usdt_addresses (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_id TEXT REFERENCES deposits(id) ON DELETE SET NULL,
  network TEXT NOT NULL CHECK(network IN ('ethereum', 'bsc', 'polygon', 'tron')),
  derivation_index INTEGER NOT NULL DEFAULT 0,
  derivation_path TEXT,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usdt_addresses_address ON usdt_addresses(address);
CREATE INDEX IF NOT EXISTS idx_usdt_addresses_user_id ON usdt_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_usdt_addresses_deposit_id ON usdt_addresses(deposit_id);
CREATE INDEX IF NOT EXISTS idx_usdt_addresses_expires_at ON usdt_addresses(expires_at);

-- ============================================
-- USDT Payment Monitoring Table
-- Tracks monitoring jobs for each USDT deposit
-- ============================================
CREATE TABLE IF NOT EXISTS usdt_payment_monitoring (
  id TEXT PRIMARY KEY,
  deposit_id TEXT NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  network TEXT NOT NULL,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_block_checked INTEGER DEFAULT 0,
  check_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usdt_monitoring_deposit_id ON usdt_payment_monitoring(deposit_id);
CREATE INDEX IF NOT EXISTS idx_usdt_monitoring_address ON usdt_payment_monitoring(address);
CREATE INDEX IF NOT EXISTS idx_usdt_monitoring_status ON usdt_payment_monitoring(status);

-- ============================================
-- Add USDT method support to deposits table
-- ============================================
-- Add usdt_amount column for tracking raw USDT amount
ALTER TABLE deposits ADD COLUMN usdt_amount REAL;

-- Add token_type for distinguishing BTC vs USDT deposits
ALTER TABLE deposits ADD COLUMN token_type TEXT DEFAULT 'btc';
