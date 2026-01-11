-- Migration: Add bonus_balance column to wallets table
-- This adds the bonus_balance column that the wallet system needs

-- Add bonus_balance column to existing wallets table
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully
ALTER TABLE wallets ADD COLUMN bonus_balance DECIMAL(18, 8) DEFAULT 0;

-- Update existing rows to have 0 bonus_balance
UPDATE wallets SET bonus_balance = 0 WHERE bonus_balance IS NULL;







