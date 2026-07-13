// =============================================================================
// register.js — POST /api/auth/register
// Creates a new user account and auto-logs them in.
// =============================================================================

import {
  getCorsHeaders,
  generateSalt,
  hashPassword,
  hashToken,
  signJwt,
  jsonResponse,
} from './_shared.js';

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const COOKIE_NAME = '__Secure-refresh';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

// -----------------------------------------------------------------------------
// OPTIONS preflight
// -----------------------------------------------------------------------------
export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

// -----------------------------------------------------------------------------
// POST /api/auth/register
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

    if (!EMAIL_RE.test(email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400, request);
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return jsonResponse(
        { error: `Password must be at least ${MIN_PASSWORD_LEN} characters` },
        400,
        request,
      );
    }

    // ------------------------------------------------------------------
    // 2. Check for existing user
    // ------------------------------------------------------------------
    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      return jsonResponse({ error: 'An account with this email already exists' }, 409, request);
    }

    // ------------------------------------------------------------------
    // 3. Hash password
    // ------------------------------------------------------------------
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    // ------------------------------------------------------------------
    // 4. Insert user
    // ------------------------------------------------------------------
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, salt, tier, credit_balance_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'free', 0, ?, ?)`,
      )
      .bind(userId, email, passwordHash, salt, now, now)
      .run();

    // ------------------------------------------------------------------
    // 5. Assign default 'User' role
    // ------------------------------------------------------------------
    const userRole = await db
      .prepare("SELECT id FROM roles WHERE name = 'User'")
      .first();

    if (userRole) {
      await db
        .prepare('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)')
        .bind(crypto.randomUUID(), userId, userRole.id)
        .run();
    }

    // ------------------------------------------------------------------
    // 6. Auto-login: sign JWT
    // ------------------------------------------------------------------
    const roles = userRole ? ['User'] : [];
    const jwt = await signJwt(
      {
        sub: userId,
        email,
        roles,
        tier: 'free',
        credit_balance_cents: 0,
      },
      env,
    );

    // ------------------------------------------------------------------
    // 7. Create refresh session
    // ------------------------------------------------------------------
    const rawRefreshToken = crypto.randomUUID();
    const tokenHash = await hashToken(rawRefreshToken);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000).toISOString();

    await db
      .prepare(
        `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, is_revoked)
         VALUES (?, ?, ?, ?, ?, 0)`,
      )
      .bind(sessionId, userId, tokenHash, expiresAt, now)
      .run();

    // ------------------------------------------------------------------
    // 8. Respond 201 with JWT + Set-Cookie
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

    return new Response(JSON.stringify({ token: jwt }), { status: 201, headers });
  } catch (err) {
    console.error('register error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}
