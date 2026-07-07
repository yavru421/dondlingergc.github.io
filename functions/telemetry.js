// Valid app names that may be tracked. Add new entries here as apps launch.
const ALLOWED_APPS = new Set([
  'pourready',
  'shotstack',
  'tap',
  'ampliloop',
  'aac',
  'intake',
  'omw',
  'wazeecha',
  'jobsite-calculator',
  'digital-fortress',
  'dgc-chat',
  'sidesnipe-visionary',
  'quantum-rabbithole',
]);

// Restrict CORS to the production origin only
const CORS_ORIGIN = 'https://dondlingergc.com';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const appName = url.searchParams.get('app');

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Vary': 'Origin',
  };

  if (!appName) {
    return new Response(JSON.stringify({ error: 'Missing app parameter' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Validate app name against allowlist (prevents open DB append)
  if (!ALLOWED_APPS.has(appName)) {
    return new Response(JSON.stringify({ error: 'Unknown app' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Handle incoming POST payloads (radar-worker telemetry writes)
  if (request.method === 'POST') {
    try {
      const payload = await request.json();
      
      const timestamp = payload.timestamp || Date.now();
      const trackingVectorX = payload.tracking_vector_x ?? 0;
      const trackingVectorY = payload.tracking_vector_y ?? 0;
      const computedEtaMinutes = payload.computed_eta_minutes ?? null;
      const gridRefLat = payload.grid_ref_lat ?? 0.0;
      const gridRefLon = payload.grid_ref_lon ?? 0.0;
      const intensity = payload.intensity ?? 0;
      const overhead = payload.overhead ?? 0;

      await env.DB
        .prepare(`
          INSERT INTO kinematic_forecasts 
          (timestamp, tracking_vector_x, tracking_vector_y, computed_eta_minutes, grid_ref_lat, grid_ref_lon, intensity, overhead) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(timestamp, trackingVectorX, trackingVectorY, computedEtaMinutes, gridRefLat, gridRefLon, intensity, overhead)
        .run();

      return new Response(JSON.stringify({ success: true, logged: true }), {
        headers: corsHeaders,
      });
    } catch (err) {
      console.error('[telemetry] POST error:', err);
      return new Response(JSON.stringify({ error: 'Failed to process payload' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  }

  // ?track=1 — increment launch counter (write operation)
  if (url.searchParams.has('track')) {
    const now = Date.now();
    try {
      const existing = await env.DB
        .prepare('SELECT id FROM app_telemetry WHERE app_name = ?')
        .bind(appName)
        .first();

      if (existing) {
        await env.DB
          .prepare('UPDATE app_telemetry SET launch_count = launch_count + 1, last_launched = ? WHERE app_name = ?')
          .bind(now, appName)
          .run();
      } else {
        await env.DB
          .prepare('INSERT INTO app_telemetry (app_name, launch_count, last_launched) VALUES (?, 1, ?)')
          .bind(appName, now)
          .run();
      }
      
      // Invalidate KV cache immediately to ensure freshness
      if (env.CRON_STATE) {
        await env.CRON_STATE.delete(`telemetry_stats_${appName}`);
      }

      return new Response(JSON.stringify({ success: true, tracked: appName }), {
        headers: corsHeaders,
      });
    } catch (err) {
      console.error('[telemetry] track error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // GET — return public stats for HUD display
  try {
    const cacheKey = `telemetry_stats_${appName}`;
    
    // Check KV Layer first
    if (env.CRON_STATE) {
      const cached = await env.CRON_STATE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' },
        });
      }
    }

    const stats = await env.DB
      .prepare('SELECT launch_count, last_launched FROM app_telemetry WHERE app_name = ?')
      .bind(appName)
      .first();
      
    let latestForecast = null;
    if (appName === 'wazeecha') {
      latestForecast = await env.DB
        .prepare('SELECT * FROM kinematic_forecasts ORDER BY timestamp DESC LIMIT 1')
        .first();
    }
      
    const finalStats = JSON.stringify({
      ...(stats || { launch_count: 0 }),
      latest_forecast: latestForecast
    });

    // Save to KV Layer for 60 seconds
    if (env.CRON_STATE) {
      await env.CRON_STATE.put(cacheKey, finalStats, { expirationTtl: 60 });
    }

    return new Response(finalStats, {
      headers: { ...corsHeaders, 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[telemetry] read error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
