export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET: Health / Status
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ready',
      endpoint: '/api/telemetry',
      d1_bound: !!env.DB,
      city: request.cf?.city || 'Unknown',
      region: request.cf?.region || 'WI',
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });
  }

  // POST: Record client scope / slider telemetry
  if (request.method === 'POST') {
    try {
      let data = {};
      try {
        data = await request.json();
      } catch {
        data = {};
      }

      const eventType = data.event || data.event_type || 'scope_interaction';
      const trade = data.trade || 'general';
      const sliderVal = data.value || data.slider_val || 0;
      const calculatedRange = data.ballpark || '';
      const cfCity = request.cf?.city || 'Wisconsin Rapids Area';
      const cfPostal = request.cf?.postalCode || '';
      const userAgent = request.headers.get('user-agent') || 'Unknown Device';

      // Log into D1 app_telemetry if available
      if (env.DB) {
        try {
          await env.DB.prepare(
            `INSERT INTO app_telemetry (app_name, launch_count, last_launched) VALUES (?, ?, ?)`
          ).bind(`telemetry_${trade}_${sliderVal}`, 1, Date.now()).run();
        } catch (dbErr) {
          console.error('D1 Telemetry Warning:', dbErr.message);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        recorded: {
          event: eventType,
          trade,
          value: sliderVal,
          ballpark: calculatedRange,
          city: cfCity,
          postal: cfPostal
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: corsHeaders
      });

    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: err.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: corsHeaders
  });
}
