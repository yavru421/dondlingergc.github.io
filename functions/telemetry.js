export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const appName = url.searchParams.get('app');

  if (!appName) {
    return new Response(JSON.stringify({ error: 'Missing app parameter' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // If the request includes ?track=1, we increment the counter
  if (url.searchParams.has('track')) {
    const now = Date.now();
    try {
      const existing = await env.DB.prepare('SELECT id FROM app_telemetry WHERE app_name = ?').bind(appName).first();
      
      if (existing) {
        await env.DB.prepare('UPDATE app_telemetry SET launch_count = launch_count + 1, last_launched = ? WHERE app_name = ?').bind(now, appName).run();
      } else {
        await env.DB.prepare('INSERT INTO app_telemetry (app_name, launch_count, last_launched) VALUES (?, 1, ?)').bind(appName, now).run();
      }
      return new Response(JSON.stringify({ success: true, tracked: appName }), { 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
  } 
  
  // Otherwise, just return the current stats for the Public HUD
  try {
    const stats = await env.DB.prepare('SELECT launch_count, last_launched FROM app_telemetry WHERE app_name = ?').bind(appName).first();
    return new Response(JSON.stringify(stats || { launch_count: 0 }), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}
