export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Default to Wazeecha coordinates if none provided
  const lat = url.searchParams.get('lat') || '44.3936';
  const lon = url.searchParams.get('lon') || '-89.8173';
  
  const OMETEO_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,precipitation_probability,precipitation,weather_code,uv_index&daily=sunrise,sunset,uv_index_max,precipitation_probability_max,wind_gusts_10m_max,weather_code,precipitation_sum,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=America%2FChicago&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  
  const cacheKey = `waz_wx_${lat}_${lon}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4-second strict edge timeout
    
    // Fetch from Open-Meteo, allowing Cloudflare's edge cache to also optimize it
    const res = await fetch(OMETEO_URL, {
        signal: controller.signal,
        cf: { cacheTtl: 600, cacheEverything: true }
    });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.text();
    
    // Save to KV with 30-minute expiration buffer
    if (env.CRON_STATE) {
      context.waitUntil(env.CRON_STATE.put(cacheKey, data, { expirationTtl: 1800 }));
    }
    
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
    
  } catch (err) {
    // If Open-Meteo times out or fails, instantly return the KV cache
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
    // Only happens on absolute first load if API is down
    return new Response(JSON.stringify({ error: 'API Timeout and no cache available' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
