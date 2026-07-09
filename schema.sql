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

CREATE TABLE IF NOT EXISTS kinematic_forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    tracking_vector_x REAL NOT NULL,
    tracking_vector_y REAL NOT NULL,
    computed_eta_minutes INTEGER,
    grid_ref_lat REAL NOT NULL,
    grid_ref_lon REAL NOT NULL,
    intensity INTEGER NOT NULL,
    overhead INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS touchscreen_diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    device_width INTEGER NOT NULL,
    device_height INTEGER NOT NULL,
    pixel_ratio REAL NOT NULL,
    grid_cols INTEGER NOT NULL,
    grid_rows INTEGER NOT NULL,
    max_touchpoints INTEGER NOT NULL,
    ghost_touches INTEGER DEFAULT 0,
    paint_percentage INTEGER NOT NULL
);
