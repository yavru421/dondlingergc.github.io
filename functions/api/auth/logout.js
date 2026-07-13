// =============================================================================
// logout.js — POST /api/auth/logout
// Revokes the active refresh session and clears the cookie.
// =============================================================================

import { getCorsHeaders, hashToken, jsonResponse } from './_shared.js';

const COOKIE_NAME = '__Secure-refresh';

/** Build a Set-Cookie that clears the refresh cookie. */
function clearCookie() {
  return [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Domain=.dondlingergc.com',
    'Path=/api/auth/refresh',
    'Max-Age=0',
  ].join('; ');
}

/** Extract a named cookie value from the Cookie header. */
function parseCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.split(';').find((c) => c.trim().startsWith(`${name}=`));
  return match ? match.split('=')[1].trim() : null;
}

// -----------------------------------------------------------------------------
// OPTIONS preflight
// -----------------------------------------------------------------------------
export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

// -----------------------------------------------------------------------------
// POST /api/auth/logout
// -----------------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.IDENTITY_DB;

  try {
    // ------------------------------------------------------------------
    // 1. Extract refresh token from cookie
    // ------------------------------------------------------------------
    const rawToken = parseCookie(request, COOKIE_NAME);

    // Even if there's no cookie, we still clear it and return success.
    // Logout should never fail from the user's perspective.
    if (rawToken) {
      // ----------------------------------------------------------------
      // 2. Revoke matching session in DB
      // ----------------------------------------------------------------
      const tokenHash = await hashToken(rawToken);
      await db
        .prepare('UPDATE user_sessions SET is_revoked = 1 WHERE token_hash = ?')
        .bind(tokenHash)
        .run();
    }

    // ------------------------------------------------------------------
    // 3. Return 200 + clear cookie
    // ------------------------------------------------------------------
    const headers = {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie(),
      ...getCorsHeaders(request),
    };

    return new Response(JSON.stringify({ message: 'Logged out' }), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('logout error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}
