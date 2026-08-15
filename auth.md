# Dondlinger GC auth.md

Authentication and registration discovery specification for autonomous agents interacting with Dondlinger GC services.

## Overview

Dondlinger GC supports automated agent discovery, registration, and delegated authorization per RFC 8414 (OAuth 2.0 Authorization Server Metadata), RFC 9470 (OAuth 2.0 Protected Resource Metadata), and the Auth.md standard.

- **Resource Server**: `https://dondlingergc.com`
- **Protected Resource Metadata**: `https://dondlingergc.com/.well-known/oauth-protected-resource`
- **Authorization Server Metadata**: `https://dondlingergc.com/.well-known/oauth-authorization-server`
- **Agent Registration Endpoint**: `https://dondlingergc.com/api/agent/register`
- **Agent Claim Endpoint**: `https://dondlingergc.com/api/agent/claim`

## Supported Identity Types

### 1. Identity Assertion (`identity_assertion`)
- **Assertion Types**:
  - `urn:ietf:params:oauth:token-type:id-jag` (Identity-JAG / JWT Assertion Grant)
  - `verified_email` (Cryptographically verified domain / email claim)
- **Credential Types**: `oauth_client_credentials`, `bearer_token`, `api_key`
- **Revocation Endpoint**: `https://dondlingergc.com/api/agent/revoke`

### 2. Anonymous Registration (`anonymous`)
- **Credential Types**: `bearer_token`, `api_key`
- **Claim Endpoint**: `https://dondlingergc.com/api/agent/claim`

## Bearer Authentication

All machine-readable API requests require standard HTTP Bearer token authorization in the request headers:
```http
Authorization: Bearer <agent_access_token>
```

## Scopes Supported

- `read`: Read public site metadata, blueprints, weather telemetry, and project status.
- `write`: Submit job intake requests and estimates.
- `intake`: Access the Dondlinger GC field intake gateway.
- `dispatch`: Query real-time severe weather intercept and emergency dispatch.
- `telemetry`: Retrieve live Edge telemetry and health metrics.
