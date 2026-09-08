/**
 * dondlingergc.com — 2026 Edge Telemetry & High-Intent Alert Engine
 * Standards: In-place Telegram card updates (editMessageText), zero alert spam,
 * operator traffic silencing, WARP/proxy geo normalization, and D1 clickstream logging.
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

function formatSessionCard(session, intentType = 'engaged', actionDetail = '') {
  const geo = `${session.city || 'Central Wisconsin'}, ${session.region || 'WI'}`;
  const ispTag = session.is_warp ? ' 🛡️ [WARP/VPN]' : (session.isp ? ` (${session.isp})` : '');
  const ref = session.referrer && session.referrer !== 'direct' ? session.referrer : 'Direct / Organic';
  const campaign = session.utm_campaign ? `\n🎯 <b>Campaign:</b> <code>${session.utm_campaign}</code>` : '';

  let header = '🟢 <b>LIVE VISITOR</b> [ACTIVE]';
  let banner = '';

  if (session.is_lead) {
    header = '🚨 <b>NEW CLIENT LEAD DISPATCH</b> [HIGH PRIORITY]';
    banner = `\n👤 <b>Client:</b> ${session.client_name || 'Website Lead'}\n` +
             `📞 <b>Contact:</b> <code>${session.contact || 'Not provided'}</code>\n` +
             `🔨 <b>Scope:</b> ${session.trade || 'General Contracting'}\n` +
             (session.notes ? `📝 <b>Notes:</b> ${session.notes}\n` : '') +
             `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (intentType === 'call' || intentType === 'sms') {
    header = '📞 <b>HIGH INTENT: PHONE / SMS TAP</b>';
    banner = `\n⚡ <b>ACTION:</b> Visitor tapped to call/text: <code>${actionDetail}</code>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (intentType === 'calc') {
    header = '💰 <b>ESTIMATOR SCOPE CALCULATION</b>';
    banner = `\n🔨 <b>Trade:</b> ${session.trade || 'Scope Calculation'}\n` +
             `💵 <b>Ballpark:</b> <b>${session.ballpark || 'Custom'}</b>\n` +
             `📐 <b>Scope Details:</b> ${actionDetail}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (intentType === 'deep_dwell') {
    header = '🔍 <b>QUALIFIED DEEP INSPECTION</b>';
    banner = `\n⏱️ <b>Verified Dwell:</b> ${session.dwell_sec}s active inspection on <b>${session.section}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  const journeyLines = (session.journey || []).slice(-4).map(item => ` • ${item}`).join('\n');

  return `${header}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    banner +
    `📍 <b>Location:</b> ${geo}${ispTag}\n` +
    `🌐 <b>Source:</b> ${ref}${campaign}\n` +
    `📱 <b>Device:</b> ${session.device}\n` +
    `⏱️ <b>Time on Site:</b> ${session.dwell_sec || 0}s\n\n` +
    `📋 <b>Activity Path:</b>\n${journeyLines || ' • Engaged on site'}\n\n` +
    `🆔 <code>${session.sid}</code> • <i>DGC Live Edge Telemetry</i>`;
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
  if (request.method !== 'POST') return new Response(JSON.stringify({ status: 'ready', engine: '2026-high-signal' }), { status: 200, headers: corsHeaders });

  try {
    const data = await request.json().catch(() => ({}));
    const candidateTokens = [env.TELEGRAM_BOT_TOKEN].filter(Boolean);
    const chatId = env.TELEGRAM_CHAT_ID || '8104595144';

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
    const tz = data.timezone || attr.timezone || '';

    // 1. OPERATOR TRAFFIC SUPPRESSION
    // If operator visits the site, log to D1 clickstream silently but NEVER send Telegram alerts
    const isOperator = Boolean(data.is_operator || attr.is_operator);

    // 2. GEOLOCATION & CLOUDFLARE WARP / PROXY NORMALIZATION
    // Fixes false "London, Cloudflare" output when John or visitors browse via Cloudflare WARP/Anycast
    let cfCity = request.cf?.city || 'Central Wisconsin';
    let cfRegion = request.cf?.region || 'WI';
    const cfIsp = request.cf?.asOrganization || '';
    let isWarp = false;

    if (
      /cloudflare/i.test(cfIsp) ||
      cfIsp.includes('13335') ||
      (cfCity === 'London' && tz.includes('Chicago')) ||
      (cfCity === 'London' && (cfRegion === 'ENG' || !cfRegion))
    ) {
      isWarp = true;
      if (tz.includes('Chicago') || tz.includes('America/Chicago') || isOperator) {
        cfCity = 'Wisconsin Rapids';
        cfRegion = 'WI';
      } else {
        cfCity = 'Midwest Region';
        cfRegion = 'US';
      }
    }

    const device = parseDevice(ua);

    // Scrub sensitive bid/proposal/client PII
    const scrubbedSection = String(section).replace(/proposal[_-]?[a-f0-9-]+/gi, 'proposal_[MASKED]').slice(0, 120);
    const scrubbedDetails = String(details).replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[EMAIL_REDACTED]').slice(0, 500);

    // 3. Monotonic Append-Only Log to Cloudflare D1
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(sid, eventType, scrubbedSection, trade, ballpark, dwell, isOperator ? 'Operator Console' : device, cfCity, cfRegion).run().catch(console.error);
    }

    // 4. ZERO-SPAM NOTIFICATION GATING (Only alert on real customer intent)
    if (isOperator) {
      // Operator activity is logged to D1 only — zero Telegram spam
      return new Response(JSON.stringify({ success: true, operator_suppressed: true, logged_to_d1: true }), { status: 200, headers: corsHeaders });
    }

    const isCallIntent = (eventType === 'intent_phone_dial' || eventType === 'call_button_click');
    const isSmsIntent = (eventType === 'intent_sms_dispatch' || eventType === 'sms_button_click');
    const isLeadIntake = (eventType === 'lead_intake' || eventType === 'intent_quote_cta' || eventType === 'cta_estimate_click' || Boolean(data.lead_name || data.contact));
    const isScopeCalc = (eventType === 'calc_scope_change' && (ballpark || (details && details.length > 5)));
    const isDeepEngaged = (eventType === 'engaged_read' && dwell >= 45);

    // Filter out low-level noise (tab switches, 4-second bounces, casual gallery clicks)
    const shouldAlertTelegram = isCallIntent || isSmsIntent || isLeadIntake || isScopeCalc || isDeepEngaged;

    if (!shouldAlertTelegram) {
      return new Response(JSON.stringify({ success: true, logged_to_d1: true }), { status: 200, headers: corsHeaders });
    }

    // 5. Telegram Live Session Card Coalescence
    if (candidateTokens.length > 0 && chatId) {
      const kv = env.TELEMETRY_SESSIONS || env.CRON_STATE || null;
      const sessionKey = `sess_${sid}`;
      let sessionState = null;

      if (kv) {
        try {
          sessionState = await kv.get(sessionKey, { type: 'json' });
        } catch (e) {}
      }

      const now = Date.now();
      let intentCategory = 'engaged';
      let actionDetail = '';

      if (isLeadIntake) {
        intentCategory = 'lead';
        actionDetail = scrubbedDetails || 'Quote Form Submission';
      } else if (isCallIntent) {
        intentCategory = 'call';
        actionDetail = scrubbedDetails || '(715) 459-3050';
      } else if (isSmsIntent) {
        intentCategory = 'sms';
        actionDetail = scrubbedDetails || '(715) 459-3050';
      } else if (isScopeCalc) {
        intentCategory = 'calc';
        actionDetail = scrubbedDetails || `${trade} (${ballpark})`;
      } else if (isDeepEngaged) {
        intentCategory = 'deep_dwell';
        actionDetail = `Active presence for ${dwell}s`;
      }

      let journeyLabel = '';
      if (isLeadIntake) journeyLabel = `📝 Lead Submitted: ${trade}`;
      else if (isCallIntent) journeyLabel = `📞 Phone Tap: ${actionDetail}`;
      else if (isSmsIntent) journeyLabel = `💬 SMS Tap: ${actionDetail}`;
      else if (isScopeCalc) journeyLabel = `💰 Estimator: ${trade} ${ballpark ? '(' + ballpark + ')' : ''}`.trim();
      else if (isDeepEngaged) journeyLabel = `⏱️ Qualified Dwell (${dwell}s)`;

      if (!sessionState) {
        sessionState = {
          sid: sid,
          city: cfCity,
          region: cfRegion,
          isp: cfIsp,
          is_warp: isWarp,
          device: device,
          referrer: attr.referrer || 'direct',
          utm_campaign: attr.utm_campaign || '',
          dwell_sec: dwell,
          section: scrubbedSection,
          trade: trade,
          ballpark: ballpark,
          is_lead: isLeadIntake,
          client_name: data.name || data.lead_name || '',
          contact: data.contact || data.phone || data.email || '',
          notes: data.notes || '',
          telegram_msg_id: null,
          active_bot_token: null,
          last_edit: now,
          journey: journeyLabel ? [journeyLabel] : []
        };
      } else {
        sessionState.dwell_sec = Math.max(sessionState.dwell_sec || 0, dwell);
        sessionState.city = cfCity;
        sessionState.region = cfRegion;
        sessionState.is_warp = isWarp;
        if (trade && trade !== 'General') sessionState.trade = trade;
        if (ballpark) sessionState.ballpark = ballpark;
        if (isLeadIntake) {
          sessionState.is_lead = true;
          sessionState.client_name = data.name || data.lead_name || sessionState.client_name;
          sessionState.contact = data.contact || data.phone || data.email || sessionState.contact;
          sessionState.notes = data.notes || sessionState.notes;
        }
        if (journeyLabel && !(sessionState.journey || []).includes(journeyLabel)) {
          sessionState.journey = sessionState.journey || [];
          sessionState.journey.push(journeyLabel);
          if (sessionState.journey.length > 6) sessionState.journey.shift();
        }
      }

      // First alert creation: Send live session card on real high-intent event
      if (!sessionState.telegram_msg_id) {
        const cardText = formatSessionCard(sessionState, intentCategory, actionDetail);
        for (const token of candidateTokens) {
          try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
              sessionState.active_bot_token = token;
              sessionState.telegram_msg_id = res.result.message_id;
              sessionState.last_edit = now;
              break;
            }
          } catch (e) {
            console.error('Telegram dispatch error on token:', e);
          }
        }
      } else {
        // In-place mutation: Update existing message card (throttled)
        const timeSinceLastEdit = now - (sessionState.last_edit || 0);
        const isImmediate = isLeadIntake || isCallIntent || isSmsIntent;
        if (isImmediate || timeSinceLastEdit >= 4000) {
          const cardText = formatSessionCard(sessionState, intentCategory, actionDetail);
          const editToken = sessionState.active_bot_token || candidateTokens[0];
          await fetch(`https://api.telegram.org/bot${editToken}/editMessageText`, {
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

    return new Response(JSON.stringify({ success: true, logged_to_d1: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
