# Dondlinger GC auth.md

Authentication and registration discovery specification for autonomous agents interacting with Dondlinger GC services.

## Overview

Dondlinger GC supports automated agent discovery, registration, and delegated authorization per RFC 8414 (OAuth 2.0 Authorization Server Metadata), RFC 9470 (OAuth 2.0 Protected Resource Metadata), and the Auth.md standard.

- **Resource Server**: `https://dondlingergc.com`
- **Protected Resource Metadata**: `https://dondlingergc.com/.well-known/oauth-protected-resource`
- **Authorization Server Metadata**: `https://dondlingergc.com/.well-known/oauth-authorization-server`
- **Registration Endpoint**: `https://dondlingergc.com/api/agent/register`
- **Claim Endpoint**: `https://dondlingergc.com/api/agent/claim`
- **Revocation Endpoint**: `https://dondlingergc.com/api/agent/revoke`

## Agent Audience

This authentication interface is designed for autonomous AI agents, multi-agent systems, and automated dispatch workflows integrating with Dondlinger GC.

## Registration Flow

Agents can register dynamically by sending a POST request to the registration endpoint.

### 1. Identity Assertion Registration (`identity_assertion`)

```http
POST /api/agent/register HTTP/1.1
Host: dondlingergc.com
Content-Type: application/json

{
  "identity_type": "identity_assertion",
  "assertion_type": "urn:ietf:params:oauth:token-type:id-jag",
  "assertion": "<signed_jwt_assertion>",
  "requested_scopes": ["read", "write", "intake", "dispatch", "telemetry"]
}
```

Response:
```json
{
  "token_type": "Bearer",
  "access_token": "<agent_access_token>",
  "expires_in": 86400,
  "scope": "read write intake dispatch telemetry"
}
```

### 2. Anonymous Agent Registration (`anonymous`)

```http
POST /api/agent/register HTTP/1.1
Host: dondlingergc.com
Content-Type: application/json

{
  "identity_type": "anonymous",
  "client_name": "AutonomousFieldAgent/1.0",
  "requested_scopes": ["read", "telemetry"]
}
```

Response:
```json
{
  "token_type": "Bearer",
  "access_token": "<anonymous_agent_token>",
  "claim_uri": "https://dondlingergc.com/api/agent/claim",
  "expires_in": 3600,
  "scope": "read telemetry"
}
```

## Credential Use & Authentication

All API requests must include the issued credentials via HTTP Bearer token in the `Authorization` header:

```http
GET /api/health HTTP/1.1
Host: dondlingergc.com
Authorization: Bearer <agent_access_token>
```

## Scopes Supported

- `read`: Read public site metadata, blueprints, weather telemetry, and project status.
- `write`: Submit job intake requests and estimates.
- `intake`: Access the Dondlinger GC field intake gateway.
- `dispatch`: Query real-time severe weather intercept and emergency dispatch.
- `telemetry`: Retrieve live Edge telemetry and health metrics.
