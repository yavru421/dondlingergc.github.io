// CORS preflight and POST handler for touchscreen diagnostics telemetry
const CORS_ORIGIN = 'https://dondlingergc.com';

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
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

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Vary': 'Origin',
  };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await request.json();
    
    const timestamp = Date.now();
    const deviceWidth = parseInt(payload.device_width) || 0;
    const deviceHeight = parseInt(payload.device_height) || 0;
    const pixelRatio = parseFloat(payload.pixel_ratio) || 1.0;
    const gridCols = parseInt(payload.grid_cols) || 0;
    const gridRows = parseInt(payload.grid_rows) || 0;
    const maxTouchpoints = parseInt(payload.max_touchpoints) || 0;
    const ghostTouches = parseInt(payload.ghost_touches) || 0;
    const paintPercentage = parseInt(payload.paint_percentage) || 0;

    await env.DB
      .prepare(`
        INSERT INTO touchscreen_diagnostics 
        (timestamp, device_width, device_height, pixel_ratio, grid_cols, grid_rows, max_touchpoints, ghost_touches, paint_percentage) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(timestamp, deviceWidth, deviceHeight, pixelRatio, gridCols, gridRows, maxTouchpoints, ghostTouches, paintPercentage)
      .run();

    return new Response(JSON.stringify({ success: true, logged: true }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('[touchscreen_telemetry] POST error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process payload' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
}
