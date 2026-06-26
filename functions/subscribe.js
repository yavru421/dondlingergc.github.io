export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://dondlingergc.com',
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
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }

    const text = await request.text();
    if (new TextEncoder().encode(text).length > 2048) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { endpoint, keys, preferences } = body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth || !preferences) {
      return new Response(JSON.stringify({ error: 'Invalid subscription object' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let endpointUrl;
    try {
      endpointUrl = new URL(endpoint);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint URL' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const allowedHosts = [
      'googleapis.com',
      'mozilla.com',
      'apple.com',
      'windows.net',
      'windows.com'
    ];

    const isValidHost = allowedHosts.some(host => {
      return endpointUrl.hostname === host || endpointUrl.hostname.endsWith('.' + host);
    });

    if (!isValidHost) {
      return new Response(JSON.stringify({ error: 'Unsupported push service provider' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const preferences_river = preferences.river ? 1 : 0;
    const preferences_aqi = preferences.aqi ? 1 : 0;
    const preferences_weather = preferences.weather ? 1 : 0;

    await env.DB.prepare(`
      INSERT INTO subscriptions (endpoint, p256dh, auth, preferences_river, preferences_aqi, preferences_weather)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        preferences_river = excluded.preferences_river,
        preferences_aqi = excluded.preferences_aqi,
        preferences_weather = excluded.preferences_weather
    `)
    .bind(endpoint, keys.p256dh, keys.auth, preferences_river, preferences_aqi, preferences_weather)
    .run();

    return new Response(JSON.stringify({ success: true, message: 'Subscribed successfully' }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[subscribe] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
