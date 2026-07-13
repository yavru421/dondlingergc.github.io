-- ============================================================
-- DondlingerGC Global Identity Schema
-- Target: dondlingergc-identity-db (prod) / waz-analytics-staging (staging)
-- Standalone — contains NO telemetry tables.
-- ============================================================

-- 1. User Accounts
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                               -- UUID v4
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,                        -- PBKDF2-SHA256 derived key (base64)
    salt TEXT NOT NULL,                                 -- Per-user random salt (base64)
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

    -- Pre-Paid Metered Utility
    credit_balance_cents INTEGER NOT NULL DEFAULT 0,

    -- Future Stripe Integration (columns exist from day one)
    subscription_tier TEXT NOT NULL DEFAULT 'free',     -- 'free', 'premium', 'admin'
    subscription_status TEXT NOT NULL DEFAULT 'inactive',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Role Definitions
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL
);

INSERT OR IGNORE INTO roles (role_name) VALUES ('User'), ('Admin'), ('Operator');

-- 3. User-Role Junction (RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 4. Session Management (Refresh Token Rotation + Revocation)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,                               -- Session UUID
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,                          -- SHA-256 of the refresh token value
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    is_revoked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON user_sessions(token_hash);

-- 5. Credit Ledger (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS credit_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,                     -- Negative = usage, Positive = top-up/refund
    balance_after_cents INTEGER NOT NULL,              -- Snapshot after this transaction
    transaction_type TEXT NOT NULL,                     -- 'topup', 'usage', 'refund', 'bonus'
    reference_id TEXT,                                  -- Stripe Payment ID or AI Gateway Request ID
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON credit_ledger(user_id, created_at DESC);
