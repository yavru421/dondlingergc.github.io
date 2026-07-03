export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const lat = url.searchParams.get('lat') || '44.3936';
  const lon = url.searchParams.get('lon') || '-89.8173';
  
  const AQI_URL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,uv_index`;
  const cacheKey = `waz_aqi_${lat}_${lon}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(AQI_URL, {
        signal: controller.signal,
        cf: { cacheTtl: 3600, cacheEverything: true }
    });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.text();
    
    if (env.CRON_STATE) {
      context.waitUntil(env.CRON_STATE.put(cacheKey, data, { expirationTtl: 14400 })); // AQI changes slower, 4h buffer
    }
    
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800'
      }
    });
    
  } catch (err) {
    if (env.CRON_STATE) {
      const cached = await env.CRON_STATE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'X-WaZ-Fallback': 'true',
            'Cache-Control': 'no-cache'
          }
        });
      }
    }
    return new Response(JSON.stringify({ error: 'API Timeout' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
