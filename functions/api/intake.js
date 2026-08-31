// Cloudflare Pages Function: /api/intake
// Universal Polymorphic Telegram Lead & Photo Dispatch Pipeline for Dondlinger General Contracting

export async function onRequestPost(context) {
  const { request, env } = context;

  // Strict Fail-Closed Env Binding (Zero Hardcoded Secret Fallbacks)
  const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('FATAL: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment bindings.');
    return new Response(JSON.stringify({
      success: false,
      error: 'Intake dispatch service unconfigured (Missing Telegram environment secrets)'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

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

      // Extract any photo files
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
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

    if (photos.length > 0) {
      // Send first photo with full lead summary caption
      const primaryPhoto = photos[0];
      const photoFormData = new FormData();
      photoFormData.append('chat_id', CHAT_ID);
      photoFormData.append('caption', telegramMessage.length > 1024 ? telegramMessage.substring(0, 1020) + '...' : telegramMessage);
      photoFormData.append('parse_mode', 'Markdown');
      photoFormData.append('photo', primaryPhoto, primaryPhoto.name || 'intake_photo.jpg');

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: photoFormData
      });
      telegramResponse = await tgRes.json();
      telegramSuccess = telegramResponse.ok;

      // Send any additional attached photos
      for (let i = 1; i < photos.length; i++) {
        const extraPhoto = photos[i];
        const extraFormData = new FormData();
        extraFormData.append('chat_id', CHAT_ID);
        extraFormData.append('caption', `📷 Additional Photo (${i + 1}/${photos.length}) — Ref \`${leadId}\``);
        extraFormData.append('parse_mode', 'Markdown');
        extraFormData.append('photo', extraPhoto, extraPhoto.name || `photo_${i}.jpg`);
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: extraFormData
        });
      }
    } else {
      // Text only dispatch
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      });
      telegramResponse = await tgRes.json();
      telegramSuccess = telegramResponse.ok;
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
