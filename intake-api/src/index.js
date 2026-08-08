export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/upload') {
      try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
          return new Response('Missing audio file', { status: 400 });
        }

        const uuid = crypto.randomUUID();
        const objectKey = `intake_${uuid}.webm`;

        // Write to R2
        await env.intake_audio.put(objectKey, audioFile.stream(), {
          httpMetadata: { contentType: 'audio/webm' }
        });

        const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

        // Write to D1
        await env.intake_inbox.prepare(
          `INSERT INTO intake_inbox (id, r2_object_key, client_ip) VALUES (?, ?, ?)`
        ).bind(uuid, objectKey, clientIp).run();

        // Send Telegram Notification
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const message = `🎙️ **New Client Vision Received!**\n\nID: \`${uuid}\`\nIP: \`${clientIp}\``;
          const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: env.TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'Markdown'
            })
          });
        }

        return new Response(JSON.stringify({ success: true, id: uuid }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};