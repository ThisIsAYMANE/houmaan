-- Migration: Fix recent_games foreign key constraint
-- Remove foreign key constraint on game_id since we're using Slotegrator game UUIDs
-- which don't exist in the local games table

-- SQLite doesn't support DROP CONSTRAINT directly, so we need to:
-- 1. Create a new table without the constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- Step 1: Create new table without foreign key on game_id
CREATE TABLE IF NOT EXISTS recent_games_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- Slotegrator UUID, no foreign key constraint
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

-- Step 2: Copy existing data
INSERT INTO recent_games_new (id, user_id, game_id, last_played)
SELECT id, user_id, game_id, last_played FROM recent_games;

-- Step 3: Drop old table
DROP TABLE IF EXISTS recent_games;

-- Step 4: Rename new table
ALTER TABLE recent_games_new RENAME TO recent_games;

-- Step 5: Recreate index
CREATE INDEX IF NOT EXISTS idx_recent_games_user ON recent_games(user_id);

