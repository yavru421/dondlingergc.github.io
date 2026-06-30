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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      
    const finalStats = JSON.stringify(stats || { launch_count: 0 });

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
