// =============================================================================
// refresh.js — POST /api/auth/refresh
// Rotates the refresh token and issues a new JWT.
// Implements strict token rotation: old token is revoked on every use.
// =============================================================================

import {
  getCorsHeaders,
  hashToken,
  signJwt,
  jsonResponse,
} from './_shared.js';

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
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
// POST /api/auth/refresh
// -----------------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.IDENTITY_DB;

  try {
    // ------------------------------------------------------------------
    // 1. Extract refresh token from cookie
    // ------------------------------------------------------------------
    const rawToken = parseCookie(request, COOKIE_NAME);
    if (!rawToken) {
      return jsonResponse({ error: 'No refresh token provided' }, 401, request);
    }

    // ------------------------------------------------------------------
    // 2. Look up active session by token hash
    // ------------------------------------------------------------------
    const tokenHash = await hashToken(rawToken);
    const session = await db
      .prepare(
        `SELECT id, user_id FROM user_sessions
         WHERE token_hash = ? AND is_revoked = 0 AND expires_at > datetime('now')`,
      )
      .bind(tokenHash)
      .first();

    if (!session) {
      // Token invalid, expired, or already revoked — clear cookie
      const headers = {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie(),
        ...getCorsHeaders(request),
      };
      return new Response(JSON.stringify({ error: 'Invalid or expired refresh token' }), {
        status: 401,
        headers,
      });
    }

    // ------------------------------------------------------------------
    // 3. Revoke the old session (one-time use)
    // ------------------------------------------------------------------
    await db
      .prepare('UPDATE user_sessions SET is_revoked = 1 WHERE id = ?')
      .bind(session.id)
      .run();

    // ------------------------------------------------------------------
    // 4. Fetch user + roles
    // ------------------------------------------------------------------
    const user = await db
      .prepare('SELECT id, email, tier, credit_balance_cents FROM users WHERE id = ?')
      .bind(session.user_id)
      .first();

    if (!user) {
      // Edge case: user was deleted while session was valid
      const headers = {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie(),
        ...getCorsHeaders(request),
      };
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers,
      });
    }

    const roleRows = await db
      .prepare(
        `SELECT r.name FROM roles r
         INNER JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = ?`,
      )
      .bind(user.id)
      .all();

    const roles = (roleRows.results || []).map((r) => r.name);

    // ------------------------------------------------------------------
    // 5. Issue new JWT
    // ------------------------------------------------------------------
    const jwt = await signJwt(
      {
        sub: user.id,
        email: user.email,
        roles,
        tier: user.tier,
        credit_balance_cents: user.credit_balance_cents,
      },
      env,
    );

    // ------------------------------------------------------------------
    // 6. Create new refresh session (rotation)
    // ------------------------------------------------------------------
    const newRawToken = crypto.randomUUID();
    const newTokenHash = await hashToken(newRawToken);
    const newSessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000).toISOString();

    await db
      .prepare(
        `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, is_revoked)
         VALUES (?, ?, ?, ?, ?, 0)`,
      )
      .bind(newSessionId, user.id, newTokenHash, expiresAt, now)
      .run();

    // ------------------------------------------------------------------
    // 7. Respond with new JWT + rotated cookie
    // ------------------------------------------------------------------
    const cookie = [
      `${COOKIE_NAME}=${newRawToken}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Domain=.dondlingergc.com',
      'Path=/api/auth/refresh',
      `Max-Age=${REFRESH_MAX_AGE}`,
    ].join('; ');

    const headers = {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
      ...getCorsHeaders(request),
    };

    return new Response(JSON.stringify({ token: jwt }), { status: 200, headers });
  } catch (err) {
    console.error('refresh error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}
