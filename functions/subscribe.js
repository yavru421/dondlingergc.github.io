export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    let body;
    try {
      body = await request.json();
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
