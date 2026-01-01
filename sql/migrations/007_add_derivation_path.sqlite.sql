-- Migration: Add derivation_path to bitcoin_addresses
-- This allows us to track HD wallet derivation paths for real address generation

-- Add derivation_path column if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully
ALTER TABLE bitcoin_addresses ADD COLUMN derivation_path TEXT;

CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_derivation_path ON bitcoin_addresses(derivation_path);



