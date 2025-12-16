-- BC.GAME Database Schema
-- Generated from Prisma schema

-- Enable UUID extension for generating IDs (using cuid-like strings)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users & Authentication
-- ============================================

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  email_verified TIMESTAMP,
  phone TEXT,
  phone_verified TIMESTAMP,
  avatar TEXT,
  vip_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  referred_by_id TEXT REFERENCES users(id)
);

CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth TIMESTAMP,
  country TEXT,
  language TEXT DEFAULT 'fr',
  currency TEXT DEFAULT 'MAD',
  theme TEXT DEFAULT 'dark',
  total_winnings DECIMAL(18, 2) DEFAULT 0,
  total_bets INTEGER DEFAULT 0,
  total_wagers DECIMAL(18, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Games & Content
-- ============================================

CREATE TABLE game_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_providers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  provider_id TEXT NOT NULL REFERENCES game_providers(id),
  category_id TEXT NOT NULL REFERENCES game_categories(id),
  thumbnail_url TEXT,
  game_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  is_original BOOLEAN DEFAULT false,
  has_buy_in BOOLEAN DEFAULT false,
  is_burst BOOLEAN DEFAULT false,
  multiplier INTEGER,
  player_count INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_games_category ON games(category_id);
CREATE INDEX idx_games_provider ON games(provider_id);
CREATE INDEX idx_games_active_featured ON games(is_active, is_featured);

CREATE TABLE promotional_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text TEXT,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Sports Betting
-- ============================================

CREATE TABLE sports (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sport_id TEXT NOT NULL REFERENCES sports(id),
  country TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leagues_sport ON leagues(sport_id);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  sport_id TEXT NOT NULL REFERENCES sports(id),
  league_id TEXT NOT NULL REFERENCES leagues(id),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  status TEXT NOT NULL,
  match_time TIMESTAMP,
  current_score TEXT,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  first_half_score TEXT,
  second_half_score TEXT,
  match_minute INTEGER,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_matches_sport_league ON matches(sport_id, league_id);
CREATE INDEX idx_matches_status_live ON matches(status, is_live);
CREATE INDEX idx_matches_time ON matches(match_time);

CREATE TABLE betting_markets (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_betting_markets_match ON betting_markets(match_id);

CREATE TABLE odds (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL REFERENCES betting_markets(id) ON DELETE CASCADE,
  selection TEXT NOT NULL,
  odds_value DECIMAL(10, 2) NOT NULL,
  previous_odds DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_odds_match_market ON odds(match_id, market_id);

-- ============================================
-- User Activity
-- ============================================

CREATE TABLE user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);

CREATE TABLE recent_games (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  last_played TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_recent_games_user ON recent_games(user_id);

CREATE TABLE user_bets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  game_id TEXT REFERENCES games(id),
  match_id TEXT REFERENCES matches(id),
  bet_type TEXT NOT NULL,
  market_type TEXT,
  selection TEXT NOT NULL,
  odds DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  potential_win DECIMAL(18, 2),
  status TEXT NOT NULL,
  result TEXT,
  payout DECIMAL(18, 2),
  currency TEXT DEFAULT 'MAD',
  placed_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_bets_user ON user_bets(user_id);
CREATE INDEX idx_user_bets_status ON user_bets(status);
CREATE INDEX idx_user_bets_placed_at ON user_bets(placed_at);

-- ============================================
-- Financial
-- ============================================

CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance DECIMAL(18, 8) DEFAULT 0,
  locked_balance DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  reference TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type_status ON transactions(type, status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE TABLE deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL,
  method TEXT NOT NULL,
  network TEXT,
  address TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL,
  bonus_amount DECIMAL(18, 8),
  bonus_id TEXT REFERENCES bonuses(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deposits_user ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);

CREATE TABLE withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL,
  method TEXT NOT NULL,
  network TEXT,
  address TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL,
  processing_time INTEGER,
  fee DECIMAL(18, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

CREATE TABLE bonuses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(18, 8),
  percentage DECIMAL(5, 2),
  min_deposit DECIMAL(18, 8),
  max_bonus DECIMAL(18, 8),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  rollover_required DECIMAL(10, 2),
  rollover_progress DECIMAL(10, 2),
  expires_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bonuses_user ON bonuses(user_id);
CREATE INDEX idx_bonuses_status ON bonuses(status);

CREATE TABLE rollover_requirements (
  id TEXT PRIMARY KEY,
  bonus_id TEXT UNIQUE NOT NULL REFERENCES bonuses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  required_amount DECIMAL(18, 2) NOT NULL,
  current_amount DECIMAL(18, 2) DEFAULT 0,
  time_remaining TIMESTAMP,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rollover_requirements_user ON rollover_requirements(user_id);

-- ============================================
-- VIP & Rewards
-- ============================================

CREATE TABLE vip_levels (
  id TEXT PRIMARY KEY,
  level INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  min_wager DECIMAL(18, 2) NOT NULL,
  benefits JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_medals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medal_type TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  is_earned BOOLEAN DEFAULT false,
  earned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, medal_type)
);

CREATE INDEX idx_user_medals_user ON user_medals(user_id);

CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id),
  referred_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  code TEXT UNIQUE NOT NULL,
  bonus_earned DECIMAL(18, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- ============================================
-- Notifications
-- ============================================

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- Functions for updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_categories_updated_at BEFORE UPDATE ON game_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_providers_updated_at BEFORE UPDATE ON game_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotional_banners_updated_at BEFORE UPDATE ON promotional_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betting_markets_updated_at BEFORE UPDATE ON betting_markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_odds_updated_at BEFORE UPDATE ON odds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_bets_updated_at BEFORE UPDATE ON user_bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonuses_updated_at BEFORE UPDATE ON bonuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rollover_requirements_updated_at BEFORE UPDATE ON rollover_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vip_levels_updated_at BEFORE UPDATE ON vip_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_medals_updated_at BEFORE UPDATE ON user_medals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

