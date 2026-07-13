// =============================================================================
// login.js — POST /api/auth/login
// Authenticates a user, returns a short-lived JWT + HttpOnly refresh cookie.
// =============================================================================

import {
  getCorsHeaders,
  hashPassword,
  hashToken,
  signJwt,
  jsonResponse,
} from './_shared.js';

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const COOKIE_NAME = '__Secure-refresh';

// -----------------------------------------------------------------------------
// OPTIONS preflight
// -----------------------------------------------------------------------------
export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.IDENTITY_DB;

  try {
    // ------------------------------------------------------------------
    // 1. Parse & validate input
    // ------------------------------------------------------------------
    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.password) {
      return jsonResponse({ error: 'Email and password are required' }, 400, request);
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    // ------------------------------------------------------------------
    // 2. Look up user by email
    // ------------------------------------------------------------------
    const user = await db
      .prepare('SELECT id, email, password_hash, salt, tier, credit_balance_cents FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      // Deliberately vague to avoid user enumeration
      return jsonResponse({ error: 'Invalid email or password' }, 401, request);
    }

    // ------------------------------------------------------------------
    // 3. Verify password
    // ------------------------------------------------------------------
    const computedHash = await hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return jsonResponse({ error: 'Invalid email or password' }, 401, request);
    }

    // ------------------------------------------------------------------
    // 4. Fetch roles
    // ------------------------------------------------------------------
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
    // 5. Sign JWT
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
    // 6. Create refresh token + session row
    // ------------------------------------------------------------------
    const rawRefreshToken = crypto.randomUUID();
    const tokenHash = await hashToken(rawRefreshToken);
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000).toISOString();

    await db
      .prepare(
        `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, is_revoked)
         VALUES (?, ?, ?, ?, ?, 0)`,
      )
      .bind(sessionId, user.id, tokenHash, expiresAt, now)
      .run();

    // ------------------------------------------------------------------
    // 7. Build response with Set-Cookie
    // ------------------------------------------------------------------
    const cookie = [
      `${COOKIE_NAME}=${rawRefreshToken}`,
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
    console.error('login error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}
