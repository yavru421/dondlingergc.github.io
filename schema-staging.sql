-- ============================================================
-- DondlingerGC Staging Schema: Auth + Metered Credit Ledger
-- Target: waz-analytics-staging (D1)
-- ============================================================

-- 1. Base telemetry tables (mirror production)
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

-- ============================================================
-- 2. User Accounts & Role-Based Auth
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                               -- UUID v4
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,                        -- Argon2id / PBKDF2 hash
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    -- Pre-Paid Metered Utility
    credit_balance_cents INTEGER NOT NULL DEFAULT 0,

    -- Future Stripe Integration
    subscription_tier TEXT NOT NULL DEFAULT 'free',     -- 'free', 'premium', 'admin'
    subscription_status TEXT NOT NULL DEFAULT 'inactive',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL
);

INSERT OR IGNORE INTO roles (role_name) VALUES ('User'), ('Admin'), ('Operator');

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. Session Management (Refresh Token Rotation)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,                           -- SHA-256 of refresh token
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    is_revoked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

-- ============================================================
-- 4. Credit Ledger (Immutable Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,                     -- Negative = usage, Positive = top-up
    balance_after_cents INTEGER NOT NULL,              -- Snapshot after transaction
    transaction_type TEXT NOT NULL,                     -- 'topup', 'usage', 'refund', 'bonus'
    reference_id TEXT,                                  -- Stripe Payment ID or AI Gateway Request ID
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON credit_ledger(user_id, created_at DESC);
