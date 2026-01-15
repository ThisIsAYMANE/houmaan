-- Migration: Game Sessions Table
-- Tracks casino game sessions for history, analytics, and self-validation

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- Slotegrator game UUID
  session_token TEXT NOT NULL, -- Session ID from Slotegrator API
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP, -- NULL if session is still active
  initial_balance REAL NOT NULL, -- User's balance when session started
  total_bet REAL DEFAULT 0, -- Total amount bet during session
  total_win REAL DEFAULT 0, -- Total amount won during session
  session_duration INTEGER, -- Duration in seconds (calculated when session ends)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_token ON game_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started_at ON game_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_started ON game_sessions(user_id, started_at);

