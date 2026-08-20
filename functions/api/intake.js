export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    let payload = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        payload[key] = value;
      }
    } else {
      payload = { raw: await request.text() };
    }

    const name = payload.name || payload.fullName || payload.client_name || 'Anonymous / Web Visitor';
    const contact = payload.contact || payload.phone || payload.email || 'Not Provided';
    const service = payload.service || payload.trade || payload.category || 'General Inquiry / Construction';
    const notes = payload.notes || payload.message || payload.description || 'No additional details provided.';
    const address = payload.address || payload.location || payload.city || 'Wisconsin Rapids Area';
    const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

    // Format rich Telegram Alert
    const telegramMessage = `🚨 <b>NEW DONDLINGER GC INTAKE LEAD!</b> 🚨\n\n` +
      `👤 <b>Name:</b> ${escapeHtml(name)}\n` +
      `📞 <b>Contact:</b> ${escapeHtml(contact)}\n` +
      `🔨 <b>Trade/Service:</b> ${escapeHtml(service)}\n` +
      `📍 <b>Location:</b> ${escapeHtml(address)}\n` +
      `📝 <b>Notes:</b> ${escapeHtml(notes)}\n\n` +
      `🌐 <b>Client IP:</b> <code>${clientIp}</code>\n` +
      `⏰ <b>Timestamp:</b> ${timestamp} (CT)`;

    // Telegram Bot Details (VoiceIntakeApp_bot)
    const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
    const chatId = env.TELEGRAM_CHAT_ID || '8104595144';

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'HTML'
      })
    });

    const tgResult = await tgRes.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Intake form received and instant Telegram notification dispatched.',
      lead: { name, service, contact },
      telegram_dispatched: tgResult.ok === true
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
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
