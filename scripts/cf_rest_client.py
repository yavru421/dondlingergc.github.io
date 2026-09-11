#!/usr/bin/env python3
"""
cf_rest_client.py — Metropolis Direct Cloudflare REST API Engine
Bypasses local Wrangler CLI discovery limitations and libuv Windows assertion bugs.
Provides direct REST access for:
  1. D1 Remote SQL execution
  2. Zone DNS record automation (*.dondlingergc.com)
  3. Edge traffic analytics
"""

import os
import sys
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

API_BASE = "https://api.cloudflare.com/client/v4"

def get_api_token() -> str:
    token = os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CF_API_TOKEN")
    if not token:
        # Fallback to local secrets vault or standard token location
        vault_path = r"C:\Users\John\.gemini\config\cloudflare_token.json"
        if os.path.exists(vault_path):
            try:
                with open(vault_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    token = data.get("api_token")
            except Exception:
                pass
    return token or ""

def _cf_request(endpoint: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None, token: str = "") -> Dict[str, Any]:
    api_token = token or get_api_token()
    if not api_token:
        return {"success": False, "error": "Missing Cloudflare API Token (set CLOUDFLARE_API_TOKEN)"}

    url = f"{API_BASE}/{endpoint.lstrip('/')}"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
        "User-Agent": "Metropolis-Direct-REST/2026.1"
    }

    data_bytes = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        return {"success": False, "status_code": e.code, "error": err_body}
    except Exception as e:
        return {"success": False, "error": str(e)}

def execute_d1_sql(account_id: str, database_id: str, sql: str, params: Optional[list] = None, token: str = "") -> Dict[str, Any]:
    """Execute raw SQL against remote D1 directly via REST API."""
    endpoint = f"accounts/{account_id}/d1/database/{database_id}/query"
    payload = {
        "sql": sql,
        "params": params or []
    }
    return _cf_request(endpoint, method="POST", payload=payload, token=token)

def list_dns_records(zone_id: str, name_filter: Optional[str] = None, token: str = "") -> Dict[str, Any]:
    """List DNS records for a given zone."""
    endpoint = f"zones/{zone_id}/dns_records"
    if name_filter:
        endpoint += f"?name={urllib.request.quote(name_filter)}"
    return _cf_request(endpoint, method="GET", token=token)

def create_dns_cname(zone_id: str, name: str, target: str, proxied: bool = True, token: str = "") -> Dict[str, Any]:
    """Create or update a CNAME record for a canonical subdomain."""
    endpoint = f"zones/{zone_id}/dns_records"
    payload = {
        "type": "CNAME",
        "name": name,
        "content": target,
        "ttl": 1,
        "proxied": proxied
    }
    return _cf_request(endpoint, method="POST", payload=payload, token=token)

if __name__ == "__main__":
    print("[INFO] Metropolis Direct Cloudflare REST Client initialized.")
    token_status = "Available" if get_api_token() else "Not set in ENV"
    print(f"[STATUS] API Token: {token_status}")
