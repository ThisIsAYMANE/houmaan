-- Migration: Casino Transactions Table
-- Tracks all casino transactions for idempotency and audit trail

CREATE TABLE IF NOT EXISTS casino_transactions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL, -- Slotegrator transaction ID (for idempotency)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Game session ID
  game_uuid TEXT NOT NULL, -- Game UUID
  action TEXT NOT NULL CHECK(action IN ('balance', 'bet', 'win', 'refund', 'rollback')),
  type TEXT, -- Transaction type (bet, tip, freespin, win, jackpot, etc.)
  amount DECIMAL(18, 8) NOT NULL, -- Transaction amount
  currency TEXT NOT NULL DEFAULT 'MAD',
  balance_before DECIMAL(18, 8), -- Balance before transaction
  balance_after DECIMAL(18, 8), -- Balance after transaction
  round_id TEXT, -- Round ID (optional)
  finished BOOLEAN DEFAULT 0, -- Is round finished
  freespin_id TEXT, -- Freespin campaign ID (if applicable)
  quantity INTEGER, -- Freespin rounds left (if applicable)
  bet_transaction_id TEXT, -- Bet transaction ID to refund (for refunds)
  rollback_transactions TEXT, -- JSON array of rolled back transaction IDs (for rollbacks)
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'reversed')),
  metadata TEXT, -- JSON metadata for additional info
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_casino_transactions_user_id ON casino_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_transaction_id ON casino_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_session_id ON casino_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_game_uuid ON casino_transactions(game_uuid);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_action ON casino_transactions(action);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_created_at ON casino_transactions(created_at);

