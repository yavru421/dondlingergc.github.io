// Cloudflare Pages Function: /api/intake
// Universal Polymorphic Telegram Lead & Photo Dispatch Pipeline for Dondlinger General Contracting

export async function onRequestPost(context) {
  const { request, env } = context;

  // Retrieve Telegram bot token & chat ID from env or fallback to verified constants
  const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '7955190883:AAE1H6OWcno17yeEoPABRdOqYcpovHSVY6k';
  const CHAT_ID = env.TELEGRAM_CHAT_ID || '8104595144';

  const contentType = request.headers.get('content-type') || '';
  let leadName = 'General Inquiry';
  let contact = 'Not provided';
  let service = 'General Scope';
  let city = 'Central Wisconsin';
  let notes = 'No additional notes';
  let origin = 'dondlingergc.com';
  let photos = [];

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      leadName = formData.get('name') || leadName;
      contact = formData.get('contact') || formData.get('phone') || formData.get('email') || contact;
      service = formData.get('service') || formData.get('trade') || service;
      city = formData.get('city') || formData.get('address') || city;
      notes = formData.get('notes') || formData.get('description') || notes;
      origin = formData.get('origin') || origin;

      // Extract any photo files - robust check across Cloudflare Workers runtime (Blob / File / stream)
      for (const [key, value] of formData.entries()) {
        const isPhotoKey = key.toLowerCase().includes('photo') || key.toLowerCase().includes('image') || key.toLowerCase().includes('file');
        const hasBinaryPayload = value && typeof value === 'object' && (
          (typeof File !== 'undefined' && value instanceof File) ||
          (typeof Blob !== 'undefined' && value instanceof Blob) ||
          (typeof value.arrayBuffer === 'function' && typeof value.size === 'number' && value.size > 0)
        );
        if (hasBinaryPayload && value.size > 0) {
          photos.push(value);
        } else if (isPhotoKey && value && typeof value.arrayBuffer === 'function' && value.size > 0) {
          photos.push(value);
        }
      }
    } else if (contentType.includes('application/json')) {
      const json = await request.json();

      // Handle nested VoiceIntake PWA payload ({ clientInfo, projectScope, timeline, keyRequirements, actionItems })
      if (json.clientInfo) {
        leadName = json.clientInfo.name || leadName;
        const contactParts = [json.clientInfo.phone, json.clientInfo.email, json.clientInfo.company].filter(Boolean);
        contact = contactParts.length > 0 ? contactParts.join(' • ') : contact;
      } else {
        leadName = json.name || leadName;
        contact = json.contact || json.phone || json.email || contact;
      }

      service = json.service || json.projectScope || (json.keyRequirements ? json.keyRequirements.join(', ') : service);
      city = json.city || json.address || (json.timeline ? `Timeline: ${json.timeline}` : city);
      origin = json.source || json.origin || 'voice-intake-app.dondlingergc.com';

      // Build rich Markdown notes if structured payload
      if (json.projectScope || json.keyRequirements) {
        const sections = [];
        if (json.estimatedBudget) sections.push(`💰 *Budget:* ${json.estimatedBudget}`);
        if (json.timeline) sections.push(`⏱️ *Timeline:* ${json.timeline}`);
        if (json.projectScope) sections.push(`📋 *Scope:* ${json.projectScope}`);
        if (json.keyRequirements && json.keyRequirements.length > 0) {
          sections.push(`📌 *Requirements:*\n• ${json.keyRequirements.join('\n• ')}`);
        }
        if (json.actionItems && json.actionItems.length > 0) {
          sections.push(`🎯 *Action Items:*\n• ${json.actionItems.join('\n• ')}`);
        }
        if (json.notes) sections.push(`📝 *Additional Notes:* ${json.notes}`);
        notes = sections.join('\n\n');
      } else {
        notes = json.notes || json.description || notes;
      }

      // Support base64 photos if passed in JSON
      if (Array.isArray(json.photos)) {
        for (const p of json.photos) {
          if (p.data && p.data.startsWith('data:image')) {
            const parts = p.data.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const byteString = atob(parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mime });
            photos.push(new File([blob], p.name || 'photo.jpg', { type: mime }));
          }
        }
      }
    } else {
      const text = await request.text();
      notes = text || notes;
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const leadId = 'DGC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const telegramMessage = 
      `🚨 *NEW CLIENT INTAKE DISPATCH* 🚨\n\n` +
      `👤 *Client:* ${leadName}\n` +
      `📞 *Contact:* \`${contact}\`\n` +
      `📍 *Location / Timeline:* ${city}\n` +
      `🔨 *Primary Trade / Service:* ${typeof service === 'string' && service.length > 80 ? service.substring(0, 80) + '...' : service}\n\n` +
      `📝 *Scope & Requirements:*\n${notes}\n\n` +
      `🕒 *Timestamp:* ${timestamp}\n` +
      `🆔 *Ref ID:* \`${leadId}\`\n` +
      `🌐 *Origin:* \`${origin}\``;

    let telegramSuccess = false;
    let telegramResponse = null;

    const candidateTokens = [
      '7955190883:AAE1H6OWcno17yeEoPABRdOqYcpovHSVY6k',
      BOT_TOKEN
    ].filter((t, i, arr) => t && arr.indexOf(t) === i && !t.startsWith('8830044077') && !t.startsWith('8617758186'));

    if (photos.length > 0) {
      for (const token of candidateTokens) {
        try {
          const primaryPhoto = photos[0];
          const primaryBuffer = await primaryPhoto.arrayBuffer();
          const primaryBlob = new Blob([primaryBuffer], { type: primaryPhoto.type || 'image/jpeg' });
          const primaryName = primaryPhoto.name || 'intake_photo_1.jpg';

          // First attempt: with Markdown caption
          let photoFormData = new FormData();
          photoFormData.append('chat_id', CHAT_ID);
          photoFormData.append('caption', telegramMessage.length > 1024 ? telegramMessage.substring(0, 1020) + '...' : telegramMessage);
          photoFormData.append('parse_mode', 'Markdown');
          photoFormData.append('photo', primaryBlob, primaryName);

          let tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: photoFormData
          });
          telegramResponse = await tgRes.json();

          // Fallback attempt: if Markdown entity parsing failed, retry with plain text caption
          if (!telegramResponse.ok) {
            photoFormData = new FormData();
            photoFormData.append('chat_id', CHAT_ID);
            const plainCaption = telegramMessage.replace(/[*`_]/g, '');
            photoFormData.append('caption', plainCaption.length > 1024 ? plainCaption.substring(0, 1020) + '...' : plainCaption);
            photoFormData.append('photo', primaryBlob, primaryName);

            tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              body: photoFormData
            });
            telegramResponse = await tgRes.json();
          }

          if (telegramResponse.ok) {
            telegramSuccess = true;
            // Send remaining photos sequentially
            for (let i = 1; i < photos.length; i++) {
              try {
                const extraPhoto = photos[i];
                const extraBuffer = await extraPhoto.arrayBuffer();
                const extraBlob = new Blob([extraBuffer], { type: extraPhoto.type || 'image/jpeg' });
                const extraName = extraPhoto.name || `photo_${i + 1}.jpg`;

                const extraFormData = new FormData();
                extraFormData.append('chat_id', CHAT_ID);
                extraFormData.append('caption', `📷 Additional Photo (${i + 1}/${photos.length}) — Ref: ${leadId}`);
                extraFormData.append('photo', extraBlob, extraName);

                await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                  method: 'POST',
                  body: extraFormData
                });
              } catch (err) {
                console.error('Error dispatching extra photo:', err);
              }
            }
            break;
          }
        } catch (e) {
          telegramResponse = { error: e.message };
        }
      }
    }

    // If photos failed or no photos were attached, fallback to text message
    if (!telegramSuccess) {
      const textNotice = photos.length > 0 
        ? `\n\n⚠️ *Notice:* ${photos.length} photo(s) were submitted by the client (${photos.map((p, i) => p.name || `photo_${i+1}`).join(', ')}), but Telegram photo dispatch failed.` 
        : '';
      const fullTextMessage = telegramMessage + textNotice;

      for (const token of candidateTokens) {
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: CHAT_ID,
              text: fullTextMessage,
              parse_mode: 'Markdown'
            })
          });
          telegramResponse = await tgRes.json();
          if (telegramResponse.ok) {
            telegramSuccess = true;
            break;
          } else {
            // Unescaped Markdown retry without parse_mode
            const rawRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: CHAT_ID,
                text: fullTextMessage.replace(/[*`_]/g, '')
              })
            });
            const rawJson = await rawRes.json();
            if (rawJson.ok) {
              telegramSuccess = true;
              telegramResponse = rawJson;
              break;
            }
          }
        } catch (e) {
          telegramResponse = { error: e.message };
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      lead_id: leadId,
      telegram_dispatched: telegramSuccess,
      photos_count: photos.length,
      message: 'Intake lead processed and forwarded to J. Dondlinger mobile dispatch.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Intake processing error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
}
