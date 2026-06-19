import { buildPushHTTPRequest } from '@pushforge/builder';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Authenticate with VAPID_PRIVATE_KEY
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
    // We compare with the string version of the JWK or a specific password. 
    // Wait, the frontend passes `password` which should match the env.VAPID_PRIVATE_KEY
    if (!token || token !== env.VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Parse request body
    const body = await request.json();
    const { title, message } = body;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (!env.VAPID_PRIVATE_KEY) {
       return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY is not configured in Cloudflare Pages' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Parse the JWK stored in the environment variable
    let privateJWK;
    try {
      privateJWK = JSON.parse(env.VAPID_PRIVATE_KEY);
    } catch(e) {
      return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY is not a valid JSON string (must be JWK)' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 4. Fetch all active subscriptions from D1
    const { results: subs } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM subscriptions').all();
    
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, message: 'No subscribers found' }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 5. Dispatch pushes in parallel using @pushforge/builder
    const sendPromises = subs.map(async (subRow) => {
      try {
        const { endpoint, headers, body: reqBody } = await buildPushHTTPRequest({
          privateJWK,
          subscription: {
            endpoint: subRow.endpoint,
            keys: { p256dh: subRow.p256dh, auth: subRow.auth }
          },
          message: {
            payload: {
              title: title || 'Admin Broadcast',
              body: message,
              data: { url: '/#wazeecha-telemetry', category: 'info', timestamp: Date.now() }
            },
            adminContact: env.VAPID_SUBJECT || 'mailto:john@dondlingergc.com'
          }
        });

        const res = await fetch(endpoint, { method: "POST", headers, body: reqBody });
        
        // Auto-prune dead subscriptions
        if (res.status === 410 || res.status === 404) {
          try {
            await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(subRow.endpoint).run();
          } catch(e) {}
        }
      } catch(err) {
        // Log individual push failure but don't crash
        console.error("Push failed for " + subRow.endpoint, err);
      }
    });

    await Promise.all(sendPromises);
    return new Response(JSON.stringify({ success: true, count: subs.length }), { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
