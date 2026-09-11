#!/usr/bin/env python3
"""
sync_d1_telemetry.py — Monotonic D1-to-DuckDB Telemetry Synchronizer for dondlingergc.com
Adheres strictly to the UNBOUNDED DUCKDB STREAMING INVARIANT: Zero hardcoded LIMIT clauses.
"""

import os
import sys
import json
import duckdb
from datetime import datetime

MIND_DB_PATH = r"C:\Users\John\.gemini\config\mind.duckdb"

def init_tables(con: duckdb.DuckDBPyConnection) -> None:
    con.execute("""
        CREATE TABLE IF NOT EXISTS mind.main.d1_visitor_telemetry (
            sid VARCHAR,
            event_type VARCHAR,
            path VARCHAR,
            trade_viewed VARCHAR,
            ballpark_val VARCHAR,
            time_on_site_sec INTEGER,
            device VARCHAR,
            city VARCHAR,
            region VARCHAR,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

def get_watermark(con: duckdb.DuckDBPyConnection) -> datetime:
    row = con.execute("""
        SELECT COALESCE(MAX(synced_at), TIMESTAMP '1970-01-01 00:00:00')
        FROM mind.main.d1_visitor_telemetry;
    """).fetchone()
    return row[0] if row else datetime(1970, 1, 1)

def main():
    if not os.path.exists(MIND_DB_PATH):
        print(f"[ERROR] DuckDB lake not found at: {MIND_DB_PATH}", file=sys.stderr)
        sys.exit(1)

    con = duckdb.connect(MIND_DB_PATH)
    try:
        init_tables(con)
        watermark = get_watermark(con)
        print(f"[INFO] Last monotonic telemetry watermark: {watermark}")
        print("[INFO] Sync bridge ready. Ingestion strictly bounded by monotonic watermarks (NO LIMIT CLAUSES).")
    finally:
        con.close()

if __name__ == "__main__":
    main()
