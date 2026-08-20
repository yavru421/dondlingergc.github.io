export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // GET: Health / Endpoint status & schema
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ready',
      endpoint: '/api/intake',
      description: 'Dondlinger General Contracting Lead Intake & Telegram Dispatch Gateway',
      accepted_methods: ['POST'],
      payload_schema: {
        name: 'string (required)',
        contact: 'string (required)',
        service: 'string (optional)',
        address: 'string (optional)',
        notes: 'string (optional)'
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders
    });
  }

  // POST: Process intake submission & dispatch to Telegram
  if (request.method === 'POST') {
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
        const rawText = await request.text();
        try {
          payload = JSON.parse(rawText);
        } catch {
          payload = { notes: rawText };
        }
      }

      const name = payload.name || payload.fullName || payload.client_name || 'Anonymous Visitor';
      const contact = payload.contact || payload.phone || payload.email || 'Not Provided';
      const service = payload.service || payload.trade || payload.category || 'General Construction / Remodeling';
      const notes = payload.notes || payload.message || payload.description || 'No extra notes.';
      const address = payload.address || payload.location || payload.city || 'Wisconsin Rapids Area';
      const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

      // Build formatted Telegram alert message
      const telegramMessage = `🚨 <b>NEW INTAKE LEAD RECEIVED!</b> 🚨\n\n` +
        `👤 <b>Name:</b> ${escapeHtml(name)}\n` +
        `📞 <b>Contact:</b> ${escapeHtml(contact)}\n` +
        `🔨 <b>Trade:</b> ${escapeHtml(service)}\n` +
        `📍 <b>Location:</b> ${escapeHtml(address)}\n` +
        `📝 <b>Notes:</b> ${escapeHtml(notes)}\n\n` +
        `🌐 <b>Client IP:</b> <code>${clientIp}</code>\n` +
        `⏰ <b>Timestamp:</b> ${timestamp} (CT)`;

      // Telegram Bot Token (VoiceIntakeApp_bot)
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
        message: 'Lead intake processed and instant Telegram alert dispatched.',
        lead: { name, contact, service, address },
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
