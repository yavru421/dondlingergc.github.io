function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function createVapidToken(audience, privateJwk) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'mailto:john@dondlingergc.com'
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const key = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    key,
    dataToSign
  );

  const encodedSignature = base64UrlEncode(signature);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;
    
    if (!token || token !== env.VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { title, message } = body;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!env.VAPID_PRIVATE_KEY) {
       return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY is not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    
    let privateJwk;
    try {
      privateJwk = JSON.parse(env.VAPID_PRIVATE_KEY);
    } catch(e) {
      return new Response(JSON.stringify({ error: 'VAPID_PRIVATE_KEY is not a valid JSON string (must be JWK)' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Ensure notifications table exists and insert the new notification
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, timestamp INTEGER)').run();
    await env.DB.prepare('INSERT INTO notifications (title, message, timestamp) VALUES (?, ?, ?)').bind(title || 'Admin Broadcast', message, Date.now()).run();

    const { results: subs } = await env.DB.prepare('SELECT endpoint FROM subscriptions').all();
    
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, message: 'No subscribers found' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const VAPID_PUBLIC_KEY = "BMb36GOhjyJJzODjpDxXhmv7PZxyR-e2miXbuOakZESk83z-TgtgobvOXYIWGkgaDTREY9A5XcaXDTBfWQToHOM";

    const sendPromises = subs.map(async (subRow) => {
      try {
        const url = new URL(subRow.endpoint);
        const audience = `${url.protocol}//${url.host}`;
        const vapidToken = await createVapidToken(audience, privateJwk);
        
        const headers = {
          'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
          'TTL': '86400',
          'Content-Length': '0'
        };

        const res = await fetch(subRow.endpoint, { method: "POST", headers });
        
        if (res.status === 410 || res.status === 404) {
          await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(subRow.endpoint).run();
        }
      } catch(err) {
        console.error("Push failed for " + subRow.endpoint, err);
      }
    });

    await Promise.all(sendPromises);
    return new Response(JSON.stringify({ success: true, count: subs.length }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
