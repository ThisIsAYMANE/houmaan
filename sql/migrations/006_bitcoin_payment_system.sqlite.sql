-- Migration: Bitcoin Payment System
-- Phase 2: Bitcoin Payment System

-- ============================================
-- Enhance Deposits Table for Bitcoin Payments
-- ============================================
-- Add Bitcoin-specific columns to deposits table

-- Add expires_at column for payment expiration (30 minutes)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully
-- Check if column exists before adding (we'll do this in the migration script)

-- Add Bitcoin-specific columns
-- Note: We'll check if columns exist in the migration script to avoid errors

-- expires_at: Payment expiration timestamp (30 minutes from creation)
-- btc_amount: Bitcoin amount in BTC
-- confirmations: Number of confirmations received
-- required_confirmations: Required confirmations (1 for testnet, 6 for mainnet)
-- payment_url: BIP21 payment URL for QR code

-- Since SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN,
-- we'll add these columns and handle errors in the migration script
-- or check column existence before adding

-- For now, we'll add the columns and the migration script will handle errors
-- In production, you'd want to check column existence first

-- Add expires_at column
-- This will be set to 30 minutes after deposit creation
ALTER TABLE deposits ADD COLUMN expires_at TIMESTAMP;

-- Add btc_amount column (Bitcoin amount)
ALTER TABLE deposits ADD COLUMN btc_amount REAL;

-- Add confirmations column
ALTER TABLE deposits ADD COLUMN confirmations INTEGER DEFAULT 0;

-- Add required_confirmations column
ALTER TABLE deposits ADD COLUMN required_confirmations INTEGER DEFAULT 1;

-- Add payment_url column (BIP21 format)
ALTER TABLE deposits ADD COLUMN payment_url TEXT;

-- Add index for expired payments cleanup
CREATE INDEX IF NOT EXISTS idx_deposits_expires_at ON deposits(expires_at);
CREATE INDEX IF NOT EXISTS idx_deposits_address ON deposits(address);
CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON deposits(tx_hash);

-- ============================================
-- Bitcoin Address Tracking Table
-- ============================================
-- Track generated addresses to prevent reuse and map addresses to deposits
CREATE TABLE IF NOT EXISTS bitcoin_addresses (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_id TEXT REFERENCES deposits(id) ON DELETE SET NULL,
  network TEXT NOT NULL CHECK(network IN ('mainnet', 'testnet')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_address ON bitcoin_addresses(address);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_user_id ON bitcoin_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_deposit_id ON bitcoin_addresses(deposit_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_expires_at ON bitcoin_addresses(expires_at);

-- ============================================
-- Exchange Rate Cache Table
-- ============================================
-- Cache Bitcoin exchange rates to reduce API calls
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  source TEXT NOT NULL,  -- 'coingecko', 'coinbase', etc.
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_expires_at ON exchange_rates(expires_at);

-- ============================================
-- Payment Monitoring Table
-- ============================================
-- Track payment monitoring jobs and status
CREATE TABLE IF NOT EXISTS payment_monitoring (
  id TEXT PRIMARY KEY,
  deposit_id TEXT NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_monitoring_deposit_id ON payment_monitoring(deposit_id);
CREATE INDEX IF NOT EXISTS idx_payment_monitoring_address ON payment_monitoring(address);
CREATE INDEX IF NOT EXISTS idx_payment_monitoring_status ON payment_monitoring(status);






