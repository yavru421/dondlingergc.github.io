const CORS_ORIGIN = 'https://dondlingergc.com';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Vary': 'Origin',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > 2048) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: CORS_HEADERS });
    }

    const text = await request.text();
    if (new TextEncoder().encode(text).length > 2048) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: CORS_HEADERS });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: CORS_HEADERS });
    }

    // Support both { endpoint, keys: { auth } } (PushSubscription JSON) and legacy { endpoint, auth }
    const endpoint = body?.endpoint;
    const auth = body?.keys?.auth ?? body?.auth;

    if (!endpoint || !auth) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Verify ownership: the requester must prove they hold the auth key
    // Only the subscribing browser has this value — it cannot be guessed
    const stored = await env.DB
      .prepare('SELECT auth FROM subscriptions WHERE endpoint = ?')
      .bind(endpoint)
      .first();

    if (!stored) {
      // Return success to avoid endpoint enumeration
      return new Response(JSON.stringify({ success: true }), {
        headers: CORS_HEADERS,
      });
    }

    if (stored.auth !== auth) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: CORS_HEADERS,
      });
    }

    await env.DB
      .prepare('DELETE FROM subscriptions WHERE endpoint = ?')
      .bind(endpoint)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
