export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ status: 'ready' }), { status: 200, headers: corsHeaders });

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
      name = formData.get('name') || name;
      contact = formData.get('contact') || contact;
      service = formData.get('service') || service;
      address = formData.get('address') || address;
      notes = formData.get('notes') || notes;
      ballpark = formData.get('ballpark') || '';

      for (const [key, value] of formData.entries()) {
        if (key.startsWith('photo_') && value instanceof File) {
          uploadedPhotos.push(value);
        }
      }
    } else {
      const data = await request.json().catch(() => ({}));
      honeypot = data.website_trap || data.hp_field || '';
      name = data.name || name;
      contact = data.contact || contact;
      service = data.service || service;
      address = data.address || address;
      notes = data.notes || notes;
      ballpark = data.ballpark || '';
    }

    // Honeypot trip check: Drop spambots silently
    if (honeypot && honeypot.trim().length > 0) {
      return new Response(JSON.stringify({ success: true, spam_dropped: true }), { status: 200, headers: corsHeaders });
    }

    const cfCity = request.cf?.city || 'Central Wisconsin';
    const cfRegion = request.cf?.region || 'WI';
    const leadId = 'lead_' + Math.random().toString(36).substring(2, 11);

    // 1. Persist to Cloudflare D1 if bound
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO intake_leads (id, name, phone, service, address, ballpark, notes, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(leadId, name, contact, service, address, ballpark, notes, cfCity, cfRegion).run().catch(console.error);
    }

    // 2. Dispatch to Telegram
    const isForumGroup = chatId.toString().startsWith('-100');
    const caption = `🚨 <b>NEW INTAKE LEAD DISPATCH</b>\n\n` +
      `👤 <b>Name:</b> <b>${name}</b>\n` +
      `📞 <b>Contact:</b> <code>${contact}</code>\n` +
      `🔨 <b>Trade / Scope:</b> <b>${service}</b>\n` +
      `📍 <b>Location:</b> ${address} (${cfCity}, ${cfRegion})\n` +
      (ballpark ? `💰 <b>Ballpark:</b> ${ballpark}\n` : '') +
      (notes ? `📝 <b>Notes:</b> ${notes}\n\n` : '\n') +
      `🆔 <code>${leadId}</code>`;

    // A. Always dispatch primary text alert first to ensure lead delivery
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

    // B. If photos were uploaded, dispatch photo attachments
    if (uploadedPhotos.length > 0) {
      try {
        const tgForm = new FormData();
        tgForm.append('chat_id', chatId);
        if (isForumGroup && leadThreadId) {
          tgForm.append('message_thread_id', leadThreadId.toString());
        }
        tgForm.append('caption', `📸 Project Photo for Lead <code>${leadId}</code> (${contact})`);
        tgForm.append('parse_mode', 'HTML');
        tgForm.append('photo', uploadedPhotos[0], uploadedPhotos[0].name);

        await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: tgForm
        });
      } catch (photoErr) {
        console.error('Photo dispatch error:', photoErr);
      }
    }

    return new Response(JSON.stringify({ success: true, lead_id: leadId }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
