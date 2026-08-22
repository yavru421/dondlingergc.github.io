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

  // GET: Health / Status
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ready',
      endpoint: '/api/telemetry',
      d1_bound: !!env.DB,
      city: request.cf?.city || 'Unknown',
      region: request.cf?.region || 'WI',
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });
  }

  // POST: Record client scope / slider telemetry
  if (request.method === 'POST') {
    try {
      let data = {};
      try {
        data = await request.json();
      } catch {
        data = {};
      }

      const eventType = data.event || data.event_type || 'scope_interaction';
      const trade = data.trade || 'general';
      const sliderVal = data.value || data.slider_val || '';
      const calculatedRange = data.ballpark || data.last_ballpark || '';
      const activeTab = data.active_tab || 'Projects';
      const viewedTrades = data.viewed_trades || trade || 'None';
      const timeOnSite = parseInt(data.time_on_site_seconds || '0', 10);
      const sid = data.sid || (request.headers.get('cf-ray') ? request.headers.get('cf-ray').split('-')[0] : 'anon_' + Math.random().toString(36).slice(2, 10));
      const ref = request.headers.get('referer') || data.referrer || '';
      const rawIp = request.headers.get('cf-connecting-ip') || '';
      const cfCity = request.cf?.city || 'Wisconsin Rapids Area';
      const cfRegion = request.cf?.region || 'WI';
      const cfPostal = request.cf?.postalCode || '';
      const userAgent = request.headers.get('user-agent') || 'Unknown Device';
      const device = userAgent.includes('iPhone') ? 'iPhone' : userAgent.includes('Android') ? 'Android' : userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';

      // Parse Search Query String if arriving from Google / Bing
      let organicQuery = null;
      if (ref) {
        try {
          const refUrl = new URL(ref);
          organicQuery = refUrl.searchParams.get('q') || refUrl.searchParams.get('query') || refUrl.searchParams.get('s') || null;
        } catch {}
      }

      // Log into D1 visitor_traffic and app_telemetry
      if (env.DB) {
        try {
          // Hash IP for privacy compliance
          let ipHash = 'anon';
          if (rawIp) {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawIp));
            ipHash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
          }

          await env.DB.prepare(`
            INSERT INTO visitor_traffic (
              sid, event_type, path, referrer, organic_query,
              trade_viewed, ballpark_val, time_on_site_sec,
              device, city, region, ip_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            sid, eventType, activeTab, ref.slice(0, 255), organicQuery,
            viewedTrades, calculatedRange, timeOnSite,
            device, cfCity, cfRegion, ipHash
          ).run();

          await env.DB.prepare(
            `INSERT INTO app_telemetry (app_name, launch_count, last_launched) VALUES (?, ?, ?)`
          ).bind(`telemetry_${eventType}`, 1, Date.now()).run();
        } catch (dbErr) {
          console.error('D1 Telemetry Write Error:', dbErr.message);
        }
      }

      // If this is a direct call or phone click event, dispatch instant Telegram Alert!
      let tgCallAlert = false;
      if (eventType === 'call_button_click' || eventType === 'direct_call_attempt' || eventType === 'sms_button_click') {
        try {
          const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
          const chatId = env.TELEGRAM_CHAT_ID || '8104595144';
          const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
          const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
          const activeTab = data.active_tab || 'Unknown Tab';
          const viewedTrades = data.viewed_trades || trade || 'None';
          const lastBallpark = data.last_ballpark || calculatedRange || 'None Calculated';
          const timeOnSite = data.time_on_site_seconds ? `${data.time_on_site_seconds}s` : 'Unknown';

          const icon = eventType === 'sms_button_click' ? '💬' : '📞';
          const actionTitle = eventType === 'sms_button_click' ? 'DIRECT SMS INTENT DETECTED' : 'INCOMING CALL INTENT / CALL BUTTON CLICKED';

          const tgMessage = `${icon} <b>${actionTitle}!</b> ${icon}\n\n` +
            `📍 <b>Expected Area:</b> <b>${cfCity}</b>${cfPostal ? ', WI ' + cfPostal : ', WI'}\n` +
            `⏰ <b>Time:</b> ${timestamp} (CT)\n\n` +
            `📊 <b>User Session Context:</b>\n` +
            `• <b>Active Page Tab:</b> ${activeTab}\n` +
            `• <b>Trade Explored:</b> ${viewedTrades}\n` +
            `• <b>Ballpark Viewed:</b> ${lastBallpark}\n` +
            `• <b>Time on Site:</b> ${timeOnSite}\n` +
            `• <b>Device:</b> <code>${userAgent.includes('iPhone') ? 'iPhone' : userAgent.includes('Android') ? 'Android' : 'Desktop/Other'}</code>\n` +
            `• <b>Client IP:</b> <code>${clientIp}</code>\n\n` +
            `⚡ <i>Get ready for a direct call/message from the ${cfCity} area!</i>`;

          const bodyPayload = {
            chat_id: chatId,
            text: tgMessage,
            parse_mode: 'HTML'
          };
          // Route to forum topic if active
          if (data.message_thread_id || data.thread_id) {
            bodyPayload.message_thread_id = data.message_thread_id || data.thread_id;
          } else {
            bodyPayload.message_thread_id = 757; // Default to active forum thread
          }

          const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });
          const tgJson = await tgRes.json();
          tgCallAlert = tgJson.ok === true;
        } catch (tgErr) {
          console.error('Call Alert Telegram Error:', tgErr.message);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        recorded: {
          event: eventType,
          trade,
          value: sliderVal,
          ballpark: calculatedRange,
          city: cfCity,
          postal: cfPostal,
          telegram_alert: tgCallAlert
        },
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
