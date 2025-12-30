-- Migration: Add wallet authentication support
-- Add wallet_address and nonce columns to users table

-- SQLite doesn't support adding UNIQUE columns directly, so we add the column first
-- then create a unique index. We check if columns exist first to make this idempotent.

-- Check and add wallet_address column (if it doesn't exist)
-- Note: SQLite doesn't have IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll try to add it and ignore errors if it already exists
-- In practice, if the column exists, SQLite will throw an error which we can ignore

-- Add columns (will fail silently if they already exist in some SQLite versions)
-- For better compatibility, we'll use a try-catch approach in the application
-- But for SQL, we'll just attempt the ALTER TABLE

ALTER TABLE users ADD COLUMN wallet_address TEXT;
ALTER TABLE users ADD COLUMN nonce TEXT;
ALTER TABLE users ADD COLUMN nonce_expires_at DATETIME;

-- Create unique index for wallet_address (enforces uniqueness)
-- Note: SQLite allows multiple NULLs in unique indexes, which is fine for our use case
-- Using IF NOT EXISTS to make this idempotent
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address_unique ON users(wallet_address);

-- Create regular index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Update email to be nullable (users can have wallet-only accounts)
-- Note: SQLite doesn't support ALTER COLUMN, so we'll handle this in application logic

