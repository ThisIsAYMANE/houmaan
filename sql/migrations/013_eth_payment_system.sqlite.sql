-- Migration: ETH Payment System
-- Adds ETH deposit tracking tables mirroring the USDT payment system

-- ============================================
-- ETH Address Tracking Table
-- Each user gets a unique EVM address for each ETH deposit
-- ============================================
CREATE TABLE IF NOT EXISTS eth_addresses (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_id TEXT REFERENCES deposits(id) ON DELETE SET NULL,
  network TEXT NOT NULL DEFAULT 'ethereum',
  derivation_index INTEGER NOT NULL DEFAULT 0,
  derivation_path TEXT,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eth_addresses_address ON eth_addresses(address);
CREATE INDEX IF NOT EXISTS idx_eth_addresses_user_id ON eth_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_eth_addresses_deposit_id ON eth_addresses(deposit_id);
CREATE INDEX IF NOT EXISTS idx_eth_addresses_expires_at ON eth_addresses(expires_at);

-- ============================================
-- ETH Payment Monitoring Table
-- Tracks monitoring jobs for each ETH deposit
-- ============================================
CREATE TABLE IF NOT EXISTS eth_payment_monitoring (
  id TEXT PRIMARY KEY,
  deposit_id TEXT NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'ethereum',
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_block_checked INTEGER DEFAULT 0,
  check_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eth_monitoring_deposit_id ON eth_payment_monitoring(deposit_id);
CREATE INDEX IF NOT EXISTS idx_eth_monitoring_address ON eth_payment_monitoring(address);
CREATE INDEX IF NOT EXISTS idx_eth_monitoring_status ON eth_payment_monitoring(status);

-- ============================================
-- Add ETH method support to deposits table
-- ============================================
-- Add eth_amount column for tracking raw ETH amount
ALTER TABLE deposits ADD COLUMN eth_amount REAL;
