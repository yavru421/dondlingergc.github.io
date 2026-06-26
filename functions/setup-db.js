export async function onRequest(context) {
  const { env } = context;
  
  try {
    // Create the table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS app_telemetry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          app_name TEXT NOT NULL,
          launch_count INTEGER DEFAULT 1,
          last_launched INTEGER NOT NULL
      );
    `).run();
    
    return new Response("Database table 'app_telemetry' created successfully. You can now delete this endpoint.", { status: 200 });
  } catch (err) {
    return new Response("Error creating table: " + err.message, { status: 500 });
  }
}
