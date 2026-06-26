CREATE TABLE IF NOT EXISTS subscriptions (
    endpoint TEXT PRIMARY KEY,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    preferences_river INTEGER DEFAULT 1,
    preferences_aqi INTEGER DEFAULT 1,
    preferences_weather INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    launch_count INTEGER DEFAULT 1,
    last_launched INTEGER NOT NULL
);
