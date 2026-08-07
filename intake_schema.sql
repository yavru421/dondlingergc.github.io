CREATE TABLE IF NOT EXISTS intake_inbox (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    r2_object_key TEXT,
    client_ip TEXT,
    status TEXT DEFAULT 'unread'
);