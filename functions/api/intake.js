/**
 * DondlingerGC - Production Intake Dispatch Engine (Cloudflare Pages Function)
 * Handles direct lead dispatch & photo uploads to Telegram Bot / Topic Thread 1 & Cloudflare D1.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ status: 'ready', endpoint: '/api/intake' }), { status: 200, headers: corsHeaders });
  }

  try {
    const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
    const chatId = env.TELEGRAM_CHAT_ID || '8104595144';
    const leadThreadId = env.TELEGRAM_LEAD_THREAD_ID ? parseInt(env.TELEGRAM_LEAD_THREAD_ID, 10) : 1;

    const ua = request.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|censys|shodan|masscan|bytespider|headless|python-requests|aiohttp|wget|curl/i.test(ua);
    if (isBot) {
      return new Response(JSON.stringify({ success: true, bot: true }), { status: 200, headers: corsHeaders });
    }

    const contentType = request.headers.get('content-type') || '';
    let name = 'Web Client';
    let contact = 'N/A';
    let service = 'General Inquiry';
    let address = 'Wisconsin Rapids Area';
    let notes = '';
    let ballpark = '';
    let honeypot = '';
    const uploadedPhotos = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      honeypot = formData.get('website_trap') || formData.get('hp_field') || '';
      name = (formData.get('name') || name).toString().trim();
      contact = (formData.get('contact') || contact).toString().trim();
      service = (formData.get('service') || service).toString().trim();
      address = (formData.get('address') || address).toString().trim();
      notes = (formData.get('notes') || notes).toString().trim();
      ballpark = (formData.get('ballpark') || '').toString().trim();

      for (const [key, value] of formData.entries()) {
        if (key.startsWith('photo_') && value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && value.size > 0) {
          const buffer = await value.arrayBuffer();
          uploadedPhotos.push({
            buffer,
            name: value.name || `photo_${uploadedPhotos.length + 1}.jpg`,
            type: value.type || 'image/jpeg'
          });
        }
      }
    } else {
      const data = await request.json().catch(() => ({}));
      honeypot = data.website_trap || data.hp_field || '';
      name = (data.name || name).toString().trim();
      contact = (data.contact || contact).toString().trim();
      service = (data.service || service).toString().trim();
      address = (data.address || address).toString().trim();
      notes = (data.notes || notes).toString().trim();
      ballpark = (data.ballpark || '').toString().trim();
    }

    // Honeypot trip check: Drop spambots silently
    if (honeypot && honeypot.trim().length > 0) {
      return new Response(JSON.stringify({ success: true, spam_dropped: true }), { status: 200, headers: corsHeaders });
    }

    const cfCity = request.cf?.city || 'Central Wisconsin';
    const cfRegion = request.cf?.region || 'WI';
    const leadId = 'DGC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Persist to Cloudflare D1 if bound
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO intake_leads (id, name, phone, service, address, ballpark, notes, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(leadId, name, contact, service, address, ballpark, notes, cfCity, cfRegion).run().catch(console.error);
    }

    // 2. Format HTML Caption (Safely Escaped)
    const isForumGroup = chatId.toString().startsWith('-100');
    const rawCaption = `🚨 <b>NEW INTAKE LEAD DISPATCH</b>\n\n` +
      `👤 <b>Name:</b> <b>${escapeHtml(name)}</b>\n` +
      `📞 <b>Contact:</b> <code>${escapeHtml(contact)}</code>\n` +
      `🔨 <b>Trade / Scope:</b> <b>${escapeHtml(service)}</b>\n` +
      `📍 <b>Location:</b> ${escapeHtml(address)} (${escapeHtml(cfCity)}, ${escapeHtml(cfRegion)})\n` +
      (ballpark ? `💰 <b>Ballpark:</b> ${escapeHtml(ballpark)}\n` : '') +
      (notes ? `📝 <b>Notes:</b> ${escapeHtml(notes)}\n\n` : '\n') +
      (uploadedPhotos.length > 0 ? `📸 <b>Attached Photos:</b> ${uploadedPhotos.length} photo(s)\n` : '') +
      `🆔 <code>${leadId}</code>`;

    // Ensure caption fits Telegram limits (1024 for photo, 4096 for message)
    const caption = rawCaption.length > 1020 ? rawCaption.substring(0, 1010) + '...</b>' : rawCaption;

    // Send text message
    const textPayload = {
      chat_id: chatId,
      text: caption,
      parse_mode: 'HTML'
    };
    if (isForumGroup && leadThreadId) {
      textPayload.message_thread_id = leadThreadId;
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    }).catch(console.error);

    // If photos were uploaded, dispatch photo attachments using preserved ArrayBuffers
    if (uploadedPhotos.length > 0) {
      for (let i = 0; i < Math.min(uploadedPhotos.length, 3); i++) {
        try {
          const photoItem = uploadedPhotos[i];
          const tgForm = new FormData();
          tgForm.append('chat_id', chatId);
          if (isForumGroup && leadThreadId) {
            tgForm.append('message_thread_id', leadThreadId.toString());
          }
          tgForm.append('caption', `📸 Project Photo ${i + 1} for Ref #${leadId} (${escapeHtml(contact)})`);
          tgForm.append('parse_mode', 'HTML');
          tgForm.append('photo', new Blob([photoItem.buffer], { type: photoItem.type }), photoItem.name);

          await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: tgForm
          }).catch(console.error);
        } catch (photoErr) {
          console.error('Photo dispatch error:', photoErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, lead_id: leadId, ticket_id: leadId }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Intake Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
