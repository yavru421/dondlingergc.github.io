export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    // Support both { endpoint, keys: { auth } } (PushSubscription JSON) and legacy { endpoint, auth }
    const endpoint = body?.endpoint;
    const auth = body?.keys?.auth ?? body?.auth;

    if (!endpoint || !auth) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (stored.auth !== auth) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await env.DB
      .prepare('DELETE FROM subscriptions WHERE endpoint = ?')
      .bind(endpoint)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
