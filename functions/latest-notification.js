export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  let allowedOrigin = 'https://dondlingergc.com';
  if (origin) {
    if (origin === 'https://dondlingergc.com' || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      allowedOrigin = origin;
    }
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin
  };

  try {
    // Get the most recent notification
    const { results } = await env.DB.prepare('SELECT title, message, timestamp FROM notifications ORDER BY id DESC LIMIT 1').all();
    
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ title: "Update", message: "New data available" }), { 
        headers: corsHeaders 
      });
    }

    return new Response(JSON.stringify(results[0]), { 
      headers: corsHeaders 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
