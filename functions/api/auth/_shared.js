// =============================================================================
// _shared.js — Shared Auth Utilities
// Pure Web Crypto, zero npm dependencies.
// =============================================================================

const ALLOWED_ORIGIN_EXACT = 'https://dondlingergc.com';
const ALLOWED_ORIGIN_SUFFIX = '.dondlingergc.com';
const JWT_LIFETIME_SEC = 15 * 60; // 15 minutes

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

/**
 * Build CORS headers. Origin is reflected only if it exactly matches the
 * apex domain or is a subdomain of dondlingergc.com.
 */
export function getCorsHeaders(request) {
  const origin = (request.headers.get('Origin') || '').trim();
  let allowedOrigin = '';

  if (origin === ALLOWED_ORIGIN_EXACT) {
    allowedOrigin = origin;
  } else {
    try {
      const url = new URL(origin);
      if (url.hostname.endsWith(ALLOWED_ORIGIN_SUFFIX)) {
        allowedOrigin = origin;
      }
    } catch (_) {
      // malformed origin — leave blank
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// -----------------------------------------------------------------------------
// HMAC Key Import
// -----------------------------------------------------------------------------

/**
 * Import env.JWT_SECRET as an HMAC-SHA256 CryptoKey for JWT signing/verifying.
 */
export async function generateKeyPair(env) {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

// -----------------------------------------------------------------------------
// JWT helpers
// -----------------------------------------------------------------------------

/** Base64-URL encode a buffer or string. */
function b64url(input) {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a Base64-URL string to a Uint8Array. */
function b64urlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Sign a JWT (HMAC-SHA256).
 *
 * @param {object} payload - Must include sub, email, roles, tier, credit_balance_cents
 * @param {object} env     - Workers env with JWT_SECRET
 * @returns {string} Compact JWT
 */
export async function signJwt(payload, env) {
  const key = await generateKeyPair(env);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = {
    ...payload,
    iat: now,
    exp: now + JWT_LIFETIME_SEC,
  };

  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${b64url(signature)}`;
}

/**
 * Verify a JWT (HMAC-SHA256). Returns the decoded payload or throws.
 */
export async function verifyJwt(token, env) {
  const key = await generateKeyPair(env);
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signatureBytes = b64urlDecode(encodedSig);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(signingInput),
  );

  if (!valid) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(encodedPayload)));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return payload;
}

// -----------------------------------------------------------------------------
// Password hashing (PBKDF2-SHA256)
// -----------------------------------------------------------------------------

/**
 * Hash a password using PBKDF2-SHA256 with 100 000 iterations.
 *
 * @param {string} password  - Plaintext password
 * @param {string} salt      - Base64-encoded salt
 * @returns {string} Base64-encoded derived key (32 bytes)
 */
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  // Decode the base64 salt back to bytes
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations: 100_000,
    },
    keyMaterial,
    256, // 32 bytes
  );

  // Return as base64
  let binary = '';
  for (const b of new Uint8Array(derived)) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Generate a 16-byte cryptographic salt, returned as base64.
 */
export function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// -----------------------------------------------------------------------------
// Token hashing (SHA-256, hex output)
// -----------------------------------------------------------------------------

/**
 * SHA-256 hash a refresh token string. Returns lowercase hex.
 */
export async function hashToken(token) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// -----------------------------------------------------------------------------
// JSON Response helper
// -----------------------------------------------------------------------------

/**
 * Return a JSON Response with CORS headers.
 */
export function jsonResponse(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request),
    },
  });
}
