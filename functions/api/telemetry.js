/**
 * dondlingergc.com — 2026 Edge Telemetry & Live Alert Coalescence Engine
 * Standards: In-place Telegram card updates (editMessageText), zero alert spam,
 * marketing attribution capture, and hardened D1 clickstream logging.
 */

function resolveCorsOrigin(origin) {
  if (origin === 'https://dondlingergc.com' || /^https:\/\/([a-zA-Z0-9-]+\.)?dondlingergc\.com$/.test(origin)) {
    return origin;
  }
  return 'https://dondlingergc.com';
}

function parseDevice(ua) {
  if (/iPhone/i.test(ua)) return 'iPhone (Safari)';
  if (/iPad/i.test(ua)) return 'iPad (Safari)';
  if (/Android/i.test(ua)) return 'Android Mobile';
  if (/Macintosh/i.test(ua)) return 'Mac Desktop';
  if (/Windows/i.test(ua)) return 'Windows Desktop';
  return 'Web Client';
}

function formatSessionCard(session, isHighIntent = false, actionDetail = '') {
  const geo = `${session.city || 'Central Wisconsin'}, ${session.region || 'WI'}`;
  const isp = session.isp ? ` (${session.isp})` : '';
  const ref = session.referrer && session.referrer !== 'direct' ? session.referrer : 'Direct / Organic';
  const campaign = session.utm_campaign ? `\n🎯 <b>Campaign:</b> <code>${session.utm_campaign}</code>` : '';

  let header = '🟢 <b>LIVE VISITOR SESSION</b> [ACTIVE]';
  let banner = '';

  if (isHighIntent) {
    header = '🚨 <b>HIGH INTENT CONVERSION ALERT</b>';
    banner = `\n⚡ <b>ACTION:</b> <b>${actionDetail}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  const journeyLines = (session.journey || []).slice(-5).map(item => ` • ${item}`).join('\n');

  return `${header}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    banner +
    `📍 <b>Origin:</b> ${geo}${isp}\n` +
    `🌐 <b>Source:</b> ${ref}${campaign}\n` +
    `📱 <b>Device:</b> ${session.device}\n` +
    `⏱️ <b>Active Dwell:</b> ${session.dwell_sec || 0}s\n\n` +
    `📋 <b>Recent Journey:</b>\n${journeyLines || ' • Engaged on site'}\n\n` +
    `🆔 <code>${session.sid}</code> • <i>Live edge telemetry (coalesced)</i>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get('origin') || '';
  const corsOrigin = resolveCorsOrigin(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ status: 'ready', standard: '2026' }), { status: 200, headers: corsHeaders });

  try {
    const data = await request.json().catch(() => ({}));
    const botToken = env.TELEGRAM_BOT_TOKEN || null;
    const chatId = env.TELEGRAM_CHAT_ID || null;

    const ua = request.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|censys|shodan|masscan|bytespider|gptbot|claudebot|headless|python-requests|aiohttp|wget|curl/i.test(ua);
    if (isBot) {
      return new Response(JSON.stringify({ success: true, bot: true }), { status: 200, headers: corsHeaders });
    }

    const sid = data.sid || (request.headers.get('cf-ray') ? request.headers.get('cf-ray').split('-')[0] : 'anon');
    const eventType = data.event || 'session_start';
    const section = data.section || data.tab || 'Home';
    const trade = data.trade || 'General';
    const ballpark = data.ballpark || '';
    const details = data.details || '';
    const dwell = data.dwell_sec || 0;
    const attr = data.attribution || {};

    const cfCity = request.cf?.city || 'Central Wisconsin';
    const cfRegion = request.cf?.region || 'WI';
    const cfIsp = request.cf?.asOrganization || '';
    const device = parseDevice(ua);

    // Scrub sensitive bid/proposal/client PII
    const scrubbedSection = String(section).replace(/proposal[_-]?[a-f0-9-]+/gi, 'proposal_[MASKED]').slice(0, 120);
    const scrubbedDetails = String(details).replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[EMAIL_REDACTED]').slice(0, 500);

    // 1. Monotonic Append-Only Log to Cloudflare D1
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(sid, eventType, scrubbedSection, trade, ballpark, dwell, device, cfCity, cfRegion).run().catch(console.error);
    }

    // 2. Telegram Live Session Card Coalescence
    if (botToken && chatId) {
      const kv = env.TELEMETRY_SESSIONS || env.CRON_STATE || null;
      const sessionKey = `sess_${sid}`;
      let sessionState = null;

      if (kv) {
        try {
          sessionState = await kv.get(sessionKey, { type: 'json' });
        } catch (e) {}
      }

      const now = Date.now();
      const isCallIntent = (eventType === 'intent_phone_dial' || eventType === 'call_button_click');
      const isSmsIntent = (eventType === 'intent_sms_dispatch' || eventType === 'sms_button_click');
      const isCtaIntent = (eventType === 'intent_quote_cta' || eventType === 'cta_estimate_click');
      const isHighIntent = isCallIntent || isSmsIntent || isCtaIntent;
      const isEngaged = (eventType === 'engaged_read' || dwell >= 4);

      let actionDetail = '';
      if (isCallIntent) actionDetail = `Phone Tap: ${scrubbedDetails || '(715) 459-3050'}`;
      else if (isSmsIntent) actionDetail = `SMS Tap: ${scrubbedDetails || '(715) 459-3050'}`;
      else if (isCtaIntent) actionDetail = `Estimate Request: ${scrubbedDetails || 'Quote Button'}`;

      let journeyLabel = '';
      if (eventType === 'session_start') journeyLabel = `Landed on ${scrubbedSection}`;
      else if (eventType === 'engaged_read') journeyLabel = `Engaged read (≥4s verified)`;
      else if (eventType === 'section_view') journeyLabel = `Navigated to ${scrubbedSection}`;
      else if (eventType === 'calc_scope_change') journeyLabel = `Calculator: ${trade} ${ballpark ? '(' + ballpark + ')' : ''}`.trim();
      else if (eventType === 'gallery_inspect') journeyLabel = `Gallery: ${scrubbedDetails || trade}`;
      else if (isHighIntent) journeyLabel = `⚡ ${actionDetail}`;
      else if (eventType === 'session_dwell') journeyLabel = `Exited site (${dwell}s total)`;

      if (!sessionState) {
        sessionState = {
          sid: sid,
          city: cfCity,
          region: cfRegion,
          isp: cfIsp,
          device: device,
          referrer: attr.referrer || 'direct',
          utm_campaign: attr.utm_campaign || '',
          dwell_sec: dwell,
          telegram_msg_id: null,
          last_edit: now,
          journey: journeyLabel ? [journeyLabel] : []
        };
      } else {
        sessionState.dwell_sec = Math.max(sessionState.dwell_sec || 0, dwell);
        if (journeyLabel && !(sessionState.journey || []).includes(journeyLabel)) {
          sessionState.journey = sessionState.journey || [];
          sessionState.journey.push(journeyLabel);
          if (sessionState.journey.length > 8) sessionState.journey.shift();
        }
      }

      // First alert creation: Send live session card on engagement or direct high-intent
      if (!sessionState.telegram_msg_id) {
        if (isEngaged || isHighIntent) {
          const cardText = formatSessionCard(sessionState, isHighIntent, actionDetail);
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: cardText,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            })
          }).then(r => r.json()).catch(() => null);

          if (res?.ok && res.result?.message_id) {
            sessionState.telegram_msg_id = res.result.message_id;
            sessionState.last_edit = now;
          }
        }
      } else {
        // In-place mutation: Update existing message card
        const timeSinceLastEdit = now - (sessionState.last_edit || 0);
        // Throttle updates: edit at most once every 3.5s unless an immediate high-intent conversion occurs
        if (isHighIntent || timeSinceLastEdit >= 3500) {
          const cardText = formatSessionCard(sessionState, isHighIntent, actionDetail);
          await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: sessionState.telegram_msg_id,
              text: cardText,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            })
          }).catch(console.error);

          sessionState.last_edit = now;
        }
      }

      // Persist session state into KV with 30-minute rolling TTL
      if (kv) {
        await kv.put(sessionKey, JSON.stringify(sessionState), { expirationTtl: 1800 }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ success: true, logged: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
