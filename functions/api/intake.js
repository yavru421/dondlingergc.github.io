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

    const contentType = request.headers.get('content-type') || '';
    let name = 'Web Client';
    let contact = 'N/A';
    let service = 'General Inquiry';
    let address = 'Wisconsin Rapids Area';
    let notes = '';
    let ballpark = '';
    const uploadedPhotos = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
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
      name = data.name || name;
      contact = data.contact || contact;
      service = data.service || service;
      address = data.address || address;
      notes = data.notes || notes;
      ballpark = data.ballpark || '';
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

    // 2. Dispatch to Telegram Thread 1 (High Priority Leads)
    const caption = `🚨 <b>NEW INTAKE LEAD DISPATCH</b>\n\n` +
      `👤 <b>Name:</b> <b>${name}</b>\n` +
      `📞 <b>Contact:</b> <code>${contact}</code>\n` +
      `🔨 <b>Trade / Scope:</b> <b>${service}</b>\n` +
      `📍 <b>Location:</b> ${address} (${cfCity}, ${cfRegion})\n` +
      (ballpark ? `💰 <b>Ballpark:</b> ${ballpark}\n` : '') +
      (notes ? `📝 <b>Notes:</b> ${notes}\n\n` : '\n') +
      `🆔 <code>${leadId}</code>`;

    if (uploadedPhotos.length === 0) {
      const tgPayload = {
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML'
      };
      if (leadThreadId) tgPayload.message_thread_id = leadThreadId;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgPayload)
      });
    } else {
      // Send Photo or Media Group
      const tgForm = new FormData();
      tgForm.append('chat_id', chatId);
      if (leadThreadId) tgForm.append('message_thread_id', leadThreadId.toString());
      tgForm.append('caption', caption);
      tgForm.append('parse_mode', 'HTML');
      tgForm.append('photo', uploadedPhotos[0], uploadedPhotos[0].name);

      await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: tgForm
      });
    }

    return new Response(JSON.stringify({ success: true, lead_id: leadId }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
