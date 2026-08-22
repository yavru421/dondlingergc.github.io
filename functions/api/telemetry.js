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

  // POST: Record client scope / interaction telemetry
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

      // 1. Log into D1 visitor_traffic and app_telemetry
      if (env.DB) {
        try {
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

      // 2. Dispatch Telegram Notification for high-intent actions & visitor arrivals
      let tgAlertSuccess = false;
      const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
      const chatId = env.TELEGRAM_CHAT_ID || '8104595144';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

      // Determine alert criteria
      const isCallOrSms = (eventType === 'call_button_click' || eventType === 'direct_call_attempt' || eventType === 'sms_button_click');
      const isLeadOrCalc = (eventType === 'concrete_calc' || eventType === 'pwa_estimate_calculate' || eventType === 'quote_requested');
      const isArrival = (eventType === 'visitor_arrival' || eventType === 'page_view_intent');

      if (isCallOrSms || isLeadOrCalc || isArrival) {
        try {
          let icon = '⚡';
          let actionTitle = 'VISITOR INTERACTION';

          if (eventType === 'sms_button_click') {
            icon = '💬';
            actionTitle = 'DIRECT SMS INTENT DETECTED';
          } else if (eventType === 'call_button_click' || eventType === 'direct_call_attempt') {
            icon = '📞';
            actionTitle = 'INCOMING CALL INTENT';
          } else if (isLeadOrCalc) {
            icon = '📐';
            actionTitle = 'CONCRETE ESTIMATOR CALCULATION';
          } else if (isArrival) {
            icon = '🌐';
            actionTitle = 'NEW VISITOR ARRIVAL';
          }

          const tgMessage = `${icon} <b>${actionTitle}!</b> ${icon}\n\n` +
            `📍 <b>Location:</b> <b>${cfCity}</b>${cfPostal ? ', WI ' + cfPostal : ', WI'}\n` +
            `⏰ <b>Time:</b> ${timestamp} (CT)\n\n` +
            `📊 <b>Telemetry Context:</b>\n` +
            `• <b>Event:</b> <code>${eventType}</code>\n` +
            `• <b>Trade / View:</b> ${viewedTrades}\n` +
            `• <b>Scope / Details:</b> ${calculatedRange || sliderVal || 'Standard'}\n` +
            `• <b>Device:</b> <code>${device}</code>\n` +
            `• <b>Client IP:</b> <code>${rawIp || 'Hidden'}</code>\n\n` +
            `⚡ <i>dondlingergc.com edge dispatch</i>`;

          const bodyPayload = {
            chat_id: chatId,
            text: tgMessage,
            parse_mode: 'HTML'
          };

          if (data.message_thread_id || data.thread_id) {
            bodyPayload.message_thread_id = data.message_thread_id || data.thread_id;
          }

          // First attempt: Topic or direct
          let tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });
          let tgJson = await tgRes.json();

          // Fallback to main chat if topic thread is closed/invalid
          if (!tgJson.ok && bodyPayload.message_thread_id) {
            delete bodyPayload.message_thread_id;
            tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload)
            });
            tgJson = await tgRes.json();
          }

          tgAlertSuccess = tgJson.ok === true;
        } catch (tgErr) {
          console.error('Telegram Telemetry Error:', tgErr.message);
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
          telegram_alert: tgAlertSuccess
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
