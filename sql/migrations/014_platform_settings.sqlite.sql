CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_settings (key, value) VALUES ('maintenance_mode', 'false') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value) VALUES ('registration_enabled', 'true') ON CONFLICT DO NOTHING;
INSERT INTO platform_settings (key, value) VALUES ('site_name', 'Shartbandee') ON CONFLICT DO NOTHING;
