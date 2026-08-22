export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let d1Projects = [];
    if (env.DB) {
      try {
        const { results } = await env.DB.prepare(
          `SELECT * FROM projects ORDER BY created_at DESC`
        ).all();
        d1Projects = results || [];
      } catch (dbErr) {
        console.error('D1 Projects Query Warning:', dbErr.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      source: d1Projects.length > 0 ? 'd1_database' : 'static_baseline',
      count: d1Projects.length,
      projects: d1Projects,
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
