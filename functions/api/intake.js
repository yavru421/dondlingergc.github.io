export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET: Endpoint Health & Schema
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ready',
      endpoint: '/api/intake',
      operator: 'J. Dondlinger',
      d1_bound: !!env.DB,
      r2_bound: !!env.MEDIA,
      accepted_methods: ['POST'],
      features: ['inline_images', 'dynamic_forum_threads', 'r2_archive', 'telegram_media_group', 'd1_telemetry'],
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });
  }

  // POST: Process Intake & Dispatch
  if (request.method === 'POST') {
    try {
      let payload = {};
      let imageFiles = []; // Array of { name, type, arrayBuffer, base64 }
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        for (const [key, value] of formData.entries()) {
          if (value instanceof File || (typeof value === 'object' && value && typeof value.arrayBuffer === 'function')) {
            if (value.size > 0) {
              const buffer = await value.arrayBuffer();
              imageFiles.push({
                name: value.name || `photo_${Date.now()}.jpg`,
                type: value.type || 'image/jpeg',
                size: value.size,
                arrayBuffer: buffer
              });
            }
          } else {
            payload[key] = value;
          }
        }
      } else if (contentType.includes('application/json')) {
        payload = await request.json();
        if (Array.isArray(payload.images)) {
          for (let i = 0; i < payload.images.length; i++) {
            const item = payload.images[i];
            if (typeof item === 'string' && item.startsWith('data:image/')) {
              const parts = item.split(',');
              const mimeMatch = parts[0].match(/data:(image\/[^;]+);base64/);
              const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
              const byteCharacters = atob(parts[1]);
              const byteNumbers = new Uint8Array(byteCharacters.length);
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
              }
              imageFiles.push({
                name: `photo_${i + 1}.jpg`,
                type: mime,
                size: byteNumbers.byteLength,
                arrayBuffer: byteNumbers.buffer
              });
            }
          }
        }
      } else {
        const rawText = await request.text();
        try {
          payload = JSON.parse(rawText);
        } catch {
          payload = { notes: rawText };
        }
      }

      const name = payload.name || payload.fullName || 'Anonymous Visitor';
      const contact = payload.contact || payload.phone || payload.email || 'Not Provided';
      const service = payload.service || payload.trade || 'General Contracting';
      const notes = payload.notes || payload.message || 'No additional notes.';
      const address = payload.address || payload.location || 'Wisconsin Rapids Area';
      const ballpark = payload.ballpark || payload.estimate_range || null;
      const sliderDetails = payload.slider_details || null;
      
      const cfCity = request.cf?.city || 'Central Wisconsin';
      const cfPostal = request.cf?.postalCode || '';
      const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
      
      // Generate Monotonic Ticket ID
      const ticketId = `DGC-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // ASYNCHRONOUS EDGE DISPATCH VIA context.waitUntil (Instant Sub-100ms Response)
      const dispatchPromise = (async () => {
        // 1. Persist to Cloudflare R2 if available
        if (env.MEDIA && imageFiles.length > 0) {
          for (let i = 0; i < imageFiles.length; i++) {
            const img = imageFiles[i];
            const ext = img.type.split('/')[1] || 'jpg';
            const r2Key = `intake/${ticketId}/photo_${i + 1}_${Date.now()}.${ext}`;
            try {
              await env.MEDIA.put(r2Key, img.arrayBuffer, {
                httpMetadata: { contentType: img.type },
                customMetadata: {
                  ticket_id: ticketId,
                  client_name: name,
                  client_contact: contact
                }
              });
              storedImageKeys.push(r2Key);
            } catch (r2Err) {
              console.error('R2 Media Upload Warning:', r2Err.message);
            }
          }
        }

        // 2. Persist to Cloudflare D1 (if DB binding is present)
        if (env.DB) {
          try {
            await env.DB.prepare(
              `INSERT INTO app_telemetry (app_name, launch_count, last_launched) VALUES (?, ?, ?)`
            ).bind(`intake_${ticketId}_img${imageFiles.length}`, 1, Date.now()).run();
          } catch (dbErr) {
            console.error('D1 Telemetry Write Warning:', dbErr.message);
          }
        }

        // Telegram Bot Token (VoiceIntakeApp_bot)
        const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
        const chatId = env.TELEGRAM_CHAT_ID || '8104595144';
        let targetThreadId = 757; // Default intake topic fallback
        let isDedicatedThreadCreated = false;

        // ATTEMPT DEDICATED PROJECT THREAD CREATION (Keeps each customer/project isolated)
        try {
          const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              name: `${name.slice(0, 30)} • ${service.slice(0, 25)} #${ticketId.split('-')[2] || 'LEAD'}`
            })
          });
          const topicJson = await topicRes.json();
          if (topicJson.ok && topicJson.result?.message_thread_id) {
            targetThreadId = topicJson.result.message_thread_id;
            isDedicatedThreadCreated = true;
          }
        } catch (topicErr) {
          console.error('Dedicated Forum Topic Creation Fallback:', topicErr.message);
        }

        try {
          if (imageFiles.length === 1) {
            const img = imageFiles[0];
            const tgForm = new FormData();
            tgForm.append('chat_id', chatId);
            tgForm.append('message_thread_id', targetThreadId.toString());
            tgForm.append('caption', tgMessage);
            tgForm.append('parse_mode', 'HTML');
            tgForm.append('photo', new Blob([img.arrayBuffer], { type: img.type }), img.name);

            await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: 'POST',
              body: tgForm
            });
          } else if (imageFiles.length > 1) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_thread_id: targetThreadId,
                text: tgMessage,
                parse_mode: 'HTML'
              })
            });

            const tgMediaGroupForm = new FormData();
            tgMediaGroupForm.append('chat_id', chatId);
            tgMediaGroupForm.append('message_thread_id', targetThreadId.toString());
            
            const mediaArray = [];
            const maxPhotos = Math.min(imageFiles.length, 10);
            for (let i = 0; i < maxPhotos; i++) {
              const attachName = `photo_${i}`;
              mediaArray.push({
                type: 'photo',
                media: `attach://${attachName}`,
                caption: i === 0 ? `📸 Job Photos for #${ticketId} (${escapeHtml(name)})` : ''
              });
              tgMediaGroupForm.append(attachName, new Blob([imageFiles[i].arrayBuffer], { type: imageFiles[i].type }), imageFiles[i].name);
            }
            tgMediaGroupForm.append('media', JSON.stringify(mediaArray));

            await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
              method: 'POST',
              body: tgMediaGroupForm
            });
          } else {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_thread_id: targetThreadId,
                text: tgMessage,
                parse_mode: 'HTML'
              })
            });
          }
        } catch (tgErr) {
          console.error('Telegram Dispatch Error:', tgErr.message);
        }
      })();

      if (context.waitUntil) {
        context.waitUntil(dispatchPromise);
      } else {
        // Fallback for runtimes without waitUntil
        dispatchPromise.catch(e => console.error('Dispatch background error:', e));
      }

      return new Response(JSON.stringify({
        success: true,
        ticket_id: ticketId,
        message: 'Lead intake received and queued for immediate dispatch.',
        lead: { name, contact, service, ballpark, location: address, city: cfCity },
        photos_received: imageFiles.length,
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

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: corsHeaders
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
