export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Ensure notifications table exists so we don't crash if called before broadcast
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, timestamp INTEGER)').run();
    
    // Get the most recent notification
    const { results } = await env.DB.prepare('SELECT title, message, timestamp FROM notifications ORDER BY id DESC LIMIT 1').all();
    
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ title: "Update", message: "New data available" }), { 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      });
    }

    return new Response(JSON.stringify(results[0]), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
