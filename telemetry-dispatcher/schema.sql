CREATE TABLE IF NOT EXISTS subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  preferences_river INTEGER DEFAULT 1,
  preferences_aqi INTEGER DEFAULT 1,
  preferences_weather INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry_state (
  key TEXT PRIMARY KEY,
  value TEXT
);
