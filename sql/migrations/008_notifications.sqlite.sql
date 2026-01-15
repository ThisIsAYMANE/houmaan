-- Notifications System for In-App Notifications
-- Phase 8: Notification System

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- bet_placed, bet_won, deposit_confirmed, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON data
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = 0;

-- Create notification_preferences table (optional, for future use)
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,
  bet_placed INTEGER DEFAULT 1,
  bet_won INTEGER DEFAULT 1,
  bet_lost INTEGER DEFAULT 1,
  bet_cashout INTEGER DEFAULT 1,
  deposit_confirmed INTEGER DEFAULT 1,
  deposit_pending INTEGER DEFAULT 1,
  withdrawal_processed INTEGER DEFAULT 1,
  withdrawal_pending INTEGER DEFAULT 1,
  bonus_received INTEGER DEFAULT 1,
  tier_upgraded INTEGER DEFAULT 1,
  admin_alert INTEGER DEFAULT 1,
  system_message INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);





