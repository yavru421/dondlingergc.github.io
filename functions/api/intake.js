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
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });
  }

  // POST: Process Intake & Dispatch
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

      // 1. Persist to Cloudflare D1 (if DB binding is present)
      if (env.DB) {
        try {
          // Log into app_telemetry or submissions table
          await env.DB.prepare(
            `INSERT INTO app_telemetry (app_name, launch_count, last_launched) VALUES (?, ?, ?)`
          ).bind(`intake_${ticketId}`, 1, Date.now()).run();
        } catch (dbErr) {
          console.error('D1 Telemetry Write Warning:', dbErr.message);
        }
      }

      // 2. Format Telegram Dispatch Message for J. Dondlinger
      let tgMessage = `🚨 <b>NEW INTAKE LEAD DISPATCHED!</b> 🚨\n\n` +
        `🎫 <b>Ticket:</b> <code>#${ticketId}</code>\n` +
        `👤 <b>Name:</b> ${escapeHtml(name)}\n` +
        `📞 <b>Contact:</b> ${escapeHtml(contact)}\n` +
        `🔨 <b>Trade Scope:</b> ${escapeHtml(service)}\n`;

      if (ballpark) {
        tgMessage += `📊 <b>Calculated Ballpark:</b> ${escapeHtml(ballpark)}\n`;
      }
      if (sliderDetails) {
        tgMessage += `📐 <b>Scope Details:</b> ${escapeHtml(typeof sliderDetails === 'object' ? JSON.stringify(sliderDetails) : sliderDetails)}\n`;
      }

      tgMessage += `📍 <b>Client Location:</b> ${escapeHtml(address)} (${escapeHtml(cfCity)}${cfPostal ? ' ' + cfPostal : ''})\n` +
        `📝 <b>Project Notes:</b> ${escapeHtml(notes)}\n\n` +
        `🌐 <b>Client IP:</b> <code>${clientIp}</code>\n` +
        `⏰ <b>Timestamp:</b> ${timestamp} (CT)`;

      // Telegram Bot Token (VoiceIntakeApp_bot)
      const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
      const chatId = env.TELEGRAM_CHAT_ID || '8104595144';

      let tgDispatched = false;
      try {
        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const tgRes = await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: tgMessage,
            parse_mode: 'HTML'
          })
        });
        const tgResult = await tgRes.json();
        tgDispatched = tgResult.ok === true;
      } catch (tgErr) {
        console.error('Telegram Dispatch Error:', tgErr.message);
      }

      return new Response(JSON.stringify({
        success: true,
        ticket_id: ticketId,
        message: 'Lead intake processed and dispatched to J. Dondlinger.',
        lead: { name, contact, service, ballpark, location: address, city: cfCity },
        telegram_dispatched: tgDispatched,
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
