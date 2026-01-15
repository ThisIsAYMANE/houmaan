-- Add admin role to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Create index for admin users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Create admin_sessions table for separate admin authentication
CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_id);

CREATE TRIGGER update_admin_sessions_updated_at AFTER UPDATE ON admin_sessions
BEGIN
  UPDATE admin_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;











