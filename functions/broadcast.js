import webpush from 'web-push';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Authenticate with VAPID_PRIVATE_KEY
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
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

    // 3. Configure web-push
    const vapidSubject = env.VAPID_SUBJECT || 'mailto:john@dondlingergc.com';
    const vapidPublicKey = env.VAPID_PUBLIC_KEY || 'BCPKbThp0d-QD3Ai8Y3eQuY54X4qsneKeJU8m05cbDcpC7Gks7GjXmONPy6e9Xs-NWtffzprS6Muyqvci7wJSPE';
    
    // Explicitly check for private key to avoid obscure crashes
    if (!env.VAPID_PRIVATE_KEY) {
       return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY is not configured in Cloudflare Pages' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, env.VAPID_PRIVATE_KEY);

    // 4. Fetch all active subscriptions from D1
    // In Pages Functions, env.DB is the bound D1 database
    const { results: subs } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM subscriptions').all();
    
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, message: 'No subscribers found' }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const payload = JSON.stringify({
      title: title || 'Admin Broadcast',
      body: message,
      data: { url: '/#wazeecha-telemetry', category: 'info', timestamp: Date.now() }
    });

    // 5. Dispatch pushes in parallel
    const sendPromises = subs.map(subRow => {
      return webpush.sendNotification({ 
        endpoint: subRow.endpoint, 
        keys: { p256dh: subRow.p256dh, auth: subRow.auth } 
      }, payload)
      .catch(async (err) => {
        // Auto-prune dead subscriptions (410 Gone, 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(subRow.endpoint).run();
          } catch(e) {}
        }
      });
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
