export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Endpoint required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from D1
    await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?')
      .bind(endpoint)
      .run();

    return new Response(JSON.stringify({ success: true, message: 'Unsubscribed successfully' }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
