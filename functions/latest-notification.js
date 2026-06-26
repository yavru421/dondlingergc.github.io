const ALLOWED_ORIGINS = new Set([
  'https://dondlingergc.com',
  'https://www.dondlingergc.com',
]);

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  // Only reflect allowed origins; fall back to primary domain
  const allowedOrigin = (origin && ALLOWED_ORIGINS.has(origin))
    ? origin
    : 'https://dondlingergc.com';

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { results } = await env.DB
      .prepare('SELECT title, message, timestamp FROM notifications ORDER BY id DESC LIMIT 1')
      .all();

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ title: 'Update', message: 'New data available' }),
        { headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify(results[0]), { headers: corsHeaders });
  } catch (err) {
    console.error('[latest-notification] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
