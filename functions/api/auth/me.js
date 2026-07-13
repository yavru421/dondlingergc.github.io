// =============================================================================
// me.js — GET /api/auth/me
// Returns the authenticated user's claims from their JWT.
// Stateless — no database round-trip needed.
// =============================================================================

import { getCorsHeaders, verifyJwt, jsonResponse } from './_shared.js';

// -----------------------------------------------------------------------------
// OPTIONS preflight
// -----------------------------------------------------------------------------
export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

// -----------------------------------------------------------------------------
// GET /api/auth/me
// -----------------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // ------------------------------------------------------------------
    // 1. Extract Bearer token
    // ------------------------------------------------------------------
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing or malformed Authorization header' }, 401, request);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return jsonResponse({ error: 'Missing token' }, 401, request);
    }

    // ------------------------------------------------------------------
    // 2. Verify JWT
    // ------------------------------------------------------------------
    let claims;
    try {
      claims = await verifyJwt(token, env);
    } catch (err) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401, request);
    }

    // ------------------------------------------------------------------
    // 3. Return user claims
    // ------------------------------------------------------------------
    return jsonResponse(
      {
        user: {
          id: claims.sub,
          email: claims.email,
          roles: claims.roles,
          tier: claims.tier,
          credit_balance_cents: claims.credit_balance_cents,
        },
      },
      200,
      request,
    );
  } catch (err) {
    console.error('me error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}
