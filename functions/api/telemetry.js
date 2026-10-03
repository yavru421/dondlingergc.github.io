/**
 * dondlingergc.com — 2026 Edge Telemetry & High-Conviction Contractor Intelligence Engine
 * Standards: In-place Telegram card updates (editMessageText), intent heat scoring (0-100),
 * inline_keyboard action buttons, datacenter bot suppression, entity/ISP classification,
 * granular project & calculator telemetry, operator traffic silencing, and D1 clickstream logging.
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

function classifyNetwork(asOrg, isWarp) {
  if (isWarp) return '🛡️ Cloudflare WARP / VPN';
  if (!asOrg) return 'Residential / Mobile';
  const org = asOrg.toLowerCase();
  if (/charter|spectrum|tds|frontier|centurylink|comcast|brightspeed/i.test(org)) {
    return `🏡 Residential (${asOrg})`;
  }
  if (/verizon|t-mobile|at&t|uscellular|sprint/i.test(org)) {
    return `📱 Mobile 5G/LTE (${asOrg})`;
  }
  if (/wood county|wisconsin rapids|stevens point|marshfield|wausau|consolidated|mid-state|school|hospital|clinic/i.test(org)) {
    return `🏢 Commercial / Institutional (${asOrg})`;
  }
  if (/amazon|aws|google cloud|microsoft|azure|digitalocean|hetzner|ovh|linode|oracle/i.test(org)) {
    return `🤖 Cloud / Datacenter (${asOrg})`;
  }
  return asOrg;
}

function calculateHeatScore(session) {
  let score = 0;
  if (session.is_lead) score += 60;
  if (session.has_phone_tap || session.has_sms_tap) score += 50;
  if (session.ballpark) score += 35;
  if (session.contact_hesitation) score += 25;
  if (session.photo_scrubs > 1) score += 25;
  if (session.project_viewed) score += 20;
  if (session.form_engaged) score += 20;
  if ((session.scroll_depth || 0) >= 75) score += 15;
  if ((session.dwell_sec || 0) >= 90) score += 15;
  else if ((session.dwell_sec || 0) >= 45) score += 10;
  if (session.network_type && session.network_type.includes('Commercial')) score += 15;
  return Math.min(100, score);
}

function buildInlineKeyboard(session) {
  const buttons = [];
  const row1 = [];

  if (session.contact && /[\d]{7,}/.test(session.contact.replace(/\D/g, ''))) {
    const rawNum = session.contact.replace(/\D/g, '');
    row1.push({ text: '📞 Call Lead', url: `tel:${rawNum}` });
    row1.push({ text: '💬 Text Lead', url: `sms:${rawNum}` });
  }

  const row2 = [
    { text: '🔨 View Projects', url: 'https://dondlingergc.com/#projects' },
    { text: '📋 DGC Hub', url: 'https://dondlingergc.com/' }
  ];

  if (row1.length > 0) buttons.push(row1);
  buttons.push(row2);
  return { inline_keyboard: buttons };
}

function formatSessionCard(session, intentType = 'engaged', actionDetail = '') {
  const geo = `${session.city || 'Central Wisconsin'}, ${session.region || 'WI'}${session.postal ? ' ' + session.postal : ''}`;
  const ref = session.referrer && session.referrer !== 'direct' ? session.referrer : 'Direct / Organic';
  const campaign = session.utm_campaign ? `\n🎯 <b>Campaign:</b> <code>${session.utm_campaign}</code>` : '';
  const score = calculateHeatScore(session);

  let badge = '🟢';
  let header = `<b>LIVE VISITOR</b> [Score: ${score}/100]`;
  if (session.is_operator) {
    badge = '🔧';
    header = `<b>OPERATOR TEST TRAFFIC</b> [Score: ${score}/100]`;
  } else if (score >= 70 || session.is_lead) {
    badge = '🔥';
    header = `<b>HOT PROSPECT DISPATCH</b> [Score: ${score}/100]`;
  } else if (intentType === 'call' || intentType === 'sms') {
    badge = '📞';
    header = `<b>PHONE / SMS TAP</b> [Score: ${score}/100]`;
  } else if (intentType === 'calc') {
    badge = '💰';
    header = `<b>ESTIMATOR SCOPE CALCULATION</b> [Score: ${score}/100]`;
  } else if (session.network_type && session.network_type.includes('Commercial')) {
    badge = '🏢';
    header = `<b>COMMERCIAL / MUNICIPAL INQUIRY</b> [Score: ${score}/100]`;
  } else if (intentType === 'deep_dwell') {
    badge = '👀';
    header = `<b>QUALIFIED PROJECT SCRUTINY</b> [Score: ${score}/100]`;
  }

  let banner = '';
  if (session.is_lead) {
    banner = `\n👤 <b>Client:</b> ${session.client_name || 'Website Lead'}\n` +
             `📞 <b>Contact:</b> <code>${session.contact || 'Not provided'}</code>\n` +
             `🔨 <b>Scope:</b> ${session.trade || 'General Contracting'}\n` +
             (session.notes ? `📝 <b>Notes:</b> ${session.notes}\n` : '') +
             `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (intentType === 'call' || intentType === 'sms') {
    banner = `\n⚡ <b>ACTION:</b> Visitor tapped to call/text: <code>${actionDetail}</code>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (intentType === 'calc') {
    banner = `\n🔨 <b>Trade:</b> ${session.trade || 'Scope Calculation'}\n` +
             `💵 <b>Ballpark:</b> <b>${session.ballpark || 'Custom'}</b>\n` +
             (actionDetail ? `📐 <b>Specs:</b> <code>${actionDetail}</code>\n` : '') +
             `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (session.project_viewed) {
    banner = `\n🔨 <b>Project Inspected:</b> <b>${session.project_viewed}</b>\n` +
             (session.photo_scrubs > 0 ? `🖼️ <b>Photos Scrubbed:</b> ${session.photo_scrubs} views\n` : '') +
             `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (session.section && session.section !== 'Home') {
    banner = `\n👀 <b>Browsing Section:</b> <b>${session.section}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else {
    banner = `\n🚀 <b>Site Entry:</b> Exploring dondlingergc.com\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  const journeyLines = (session.journey || []).slice(-5).map(item => ` • ${item}`).join('\n');
  const scrollText = session.scroll_depth ? ` | 📜 ${session.scroll_depth}% Depth` : '';

  return `${badge} ${header}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    banner +
    `📍 <b>Location:</b> ${geo}\n` +
    `🌐 <b>Network:</b> ${session.network_type || 'Residential'}\n` +
    `🔗 <b>Source:</b> ${ref}${campaign}\n` +
    `📱 <b>Device:</b> ${session.device} • ⏱️ ${session.dwell_sec || 0}s${scrollText}\n\n` +
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
  if (request.method !== 'POST') return new Response(JSON.stringify({ status: 'ready', engine: '2026-high-conviction' }), { status: 200, headers: corsHeaders });

  try {
    const data = await request.json().catch(() => ({}));
    const candidateTokens = [env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_APP_BOT_TOKEN].filter(Boolean);
    const PERSONAL_CHAT_ID = env.TELEGRAM_CHAT_ID || '8104595144';
    const GROUP_CHAT_ID = env.TELEGRAM_GROUP_CHAT_ID || '-1004418238851';
    const targets = [PERSONAL_CHAT_ID, GROUP_CHAT_ID].filter(Boolean);
    const configuredThreadId = env.TELEGRAM_THREAD_ID ? parseInt(env.TELEGRAM_THREAD_ID, 10) : null;

    const ua = request.headers.get('user-agent') || '';
    const cookieHeader = request.headers.get('cookie') || '';
    const vidCookieMatch = cookieHeader.match(/dgc_vid=([^;]+)/);
    const sidCookieMatch = cookieHeader.match(/dgc_sid=([^;]+)/);
    const vid = data.vid || (vidCookieMatch ? decodeURIComponent(vidCookieMatch[1]) : 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4));
    const sid = data.sid || (sidCookieMatch ? decodeURIComponent(sidCookieMatch[1]) : (request.headers.get('cf-ray') ? request.headers.get('cf-ray').split('-')[0] : 's_' + Math.random().toString(36).substring(2, 10)));
    const eventType = data.event || 'session_start';
    const section = data.section || data.tab || 'Home';
    const project = data.project || '';
    const trade = data.trade || 'General';
    const ballpark = data.ballpark || '';
    const details = data.details || '';
    const dwell = data.dwell_sec || 0;
    const scrollDepth = data.scroll_depth || 0;
    const attr = data.attribution || {};
    const tz = data.timezone || attr.timezone || '';

    // 1. OPERATOR TRAFFIC & TEST FLAGS
    const isOperator = Boolean(data.is_operator || attr.is_operator);
    const isTestDispatch = Boolean(data.test_dispatch || attr.test_dispatch);

    const isBot = /bot|crawl|spider|slurp|censys|shodan|masscan|bytespider|gptbot|claudebot|headless|python-requests|aiohttp|wget/i.test(ua);
    if (isBot && !isOperator && !isTestDispatch) {
      return new Response(JSON.stringify({ success: true, bot: true }), { status: 200, headers: corsHeaders });
    }

    // 2. GEOLOCATION & NETWORK CLASSIFICATION
    let cfCity = request.cf?.city || 'Central Wisconsin';
    let cfRegion = request.cf?.region || 'WI';
    const cfPostal = request.cf?.postalCode || '';
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

    const networkType = classifyNetwork(cfIsp, isWarp);

    // Filter out pure cloud/datacenter bots that bypass UA check
    if (networkType.includes('🤖 Cloud / Datacenter') && !isOperator) {
      return new Response(JSON.stringify({ success: true, suppressed_datacenter: true }), { status: 200, headers: corsHeaders });
    }

    const device = parseDevice(ua);

    // 100% Raw Telemetry Ingestion (No Masking / Zero Redaction)
    const rawSection = String(section || 'Home').slice(0, 255);
    const rawProject = String(project || '').slice(0, 255);
    const rawDetails = String(details || '').slice(0, 2000);

    // 3. Monotonic Append-Only Log to Cloudflare D1 (Unified Fleet Persistence)
    const trafficDb = env.TRAFFIC_DB || env.DB;
    if (trafficDb) {
      const nowIso = new Date().toISOString();
      const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown';
      const clientCountry = request.cf?.country || 'US';
      const clientAsn = cfIsp ? ('AS' + (request.cf?.asn || '')) : '';
      const clientColo = request.cf?.colo || 'ORD';

      // 3a. Primary write to unified site_traffic_events
      try {
        await trafficDb.prepare(`
          INSERT INTO site_traffic_events (
            session_id, visitor_id, event_type, domain, page_path, page_title,
            track_name, asset_name, details_json, dwell_sec, active_dwell_sec,
            scroll_depth_pct, listen_pct, ip, country, region, city, postal_code,
            timezone, asn, isp_org, colo, device_type, user_agent, referrer,
            utm_source, utm_campaign, created_at, trade_viewed, ballpark_val,
            project_name, network_type, is_operator
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sid, vid, eventType, 'dondlingergc.com', rawProject || rawSection, rawSection,
          null, null, rawDetails ? JSON.stringify({ details: rawDetails }) : null, dwell, dwell,
          scrollDepth, 0, clientIp, clientCountry, cfRegion, cfCity, cfPostal,
          tz, clientAsn, cfIsp, clientColo, device, ua, attr.referrer || 'direct',
          attr.utm_source || '', attr.utm_campaign || '', nowIso,
          trade, ballpark, rawProject, networkType, isOperator ? 1 : 0
        ).run();

        // 3b. Upsert into site_sessions for cross-domain retention and duration tracking
        await trafficDb.prepare(`
          INSERT INTO site_sessions (
            session_id, visitor_id, domain, ip, country, region, city, asn, isp_org, colo,
            device_type, user_agent, referrer, landing_page, identified_contact,
            first_seen, last_seen, duration_seconds, pageviews_count, plays_count, downloads_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(session_id) DO UPDATE SET
            last_seen = excluded.last_seen,
            duration_seconds = MAX(site_sessions.duration_seconds, excluded.duration_seconds),
            pageviews_count = site_sessions.pageviews_count + excluded.pageviews_count,
            identified_contact = COALESCE(excluded.identified_contact, site_sessions.identified_contact),
            isp_org = COALESCE(site_sessions.isp_org, excluded.isp_org)
        `).bind(
          sid, vid, 'dondlingergc.com', clientIp, clientCountry, cfRegion, cfCity, clientAsn, cfIsp, clientColo,
          device, ua, attr.referrer || 'direct', rawSection, (data.contact || '').trim() || null,
          nowIso, nowIso, dwell, (eventType === 'session_start' || eventType === 'section_view') ? 1 : 0, 0, 0
        ).run().catch(() => {});
      } catch (errEvents) {
        console.error('Error writing to site_traffic_events:', errEvents);
      }

      // 3c. Legacy visitor_traffic write for compatibility
      try {
        await trafficDb.prepare(`
          INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(sid, eventType, rawProject || rawSection, trade, ballpark, dwell, isOperator ? 'Operator Console' : device, cfCity, cfRegion).run();
      } catch (errVt) {}
    }

    // 4. HIGH-SIGNAL NOTIFICATION GATING
    const isSessionStart = (eventType === 'session_start');
    const isSectionView = (eventType === 'section_view');
    const isScrollMilestone = (eventType === 'scroll_milestone' && (scrollDepth === 50 || scrollDepth === 90));
    const isCallIntent = (eventType === 'intent_phone_dial' || eventType === 'call_button_click');
    const isSmsIntent = (eventType === 'intent_sms_dispatch' || eventType === 'sms_button_click');
    const isLeadIntake = (eventType === 'lead_intake' || eventType === 'intent_quote_cta' || eventType === 'cta_estimate_click' || Boolean(data.lead_name || data.contact));
    const isScopeCalc = (eventType === 'calc_scope_change' && (ballpark || (details && details.length > 5)));
    const isProjectInspect = (eventType === 'project_inspect' || eventType === 'photo_scrub' || eventType === 'gallery_inspect');
    const isHesitation = (eventType === 'contact_hesitation');
    const isFormEngage = (eventType === 'form_engage');
    const isDeepEngaged = (eventType === 'engaged_read' && dwell >= 45);

    // Alert on all real visitor milestones, contractor estimator changes, and leads
    const shouldAlertTelegram = isSessionStart || isSectionView || isScrollMilestone || isCallIntent || isSmsIntent || isLeadIntake || isScopeCalc || isProjectInspect || isHesitation || isFormEngage || isDeepEngaged || isTestDispatch || isOperator;

    function makeTelemetryResponse(bodyObj, status = 200) {
      const respHeaders = new Headers(corsHeaders);
      const isDgcDomain = origin.includes('dondlingergc.com');
      const domainAttr = isDgcDomain ? '; Domain=.dondlingergc.com' : '';
      respHeaders.append('Set-Cookie', `dgc_vid=${encodeURIComponent(vid)}${domainAttr}; Path=/; SameSite=Lax; Secure; Max-Age=31536000`);
      respHeaders.append('Set-Cookie', `dgc_sid=${encodeURIComponent(sid)}${domainAttr}; Path=/; SameSite=Lax; Secure; Max-Age=1800`);
      return new Response(JSON.stringify(bodyObj), { status, headers: respHeaders });
    }

    if (!shouldAlertTelegram) {
      return makeTelemetryResponse({ success: true, logged_to_d1: true, vid, sid });
    }

    // 5. Telegram Live Session Card Coalescence & Dual-Target Delivery
    if (candidateTokens.length > 0 && targets.length > 0) {
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
        actionDetail = rawDetails || 'Quote Form Submission';
      } else if (isCallIntent) {
        intentCategory = 'call';
        actionDetail = rawDetails || '(715) 459-3050';
      } else if (isSmsIntent) {
        intentCategory = 'sms';
        actionDetail = rawDetails || '(715) 459-3050';
      } else if (isScopeCalc) {
        intentCategory = 'calc';
        actionDetail = rawDetails || `${trade} (${ballpark})`;
      } else if (isProjectInspect) {
        intentCategory = 'project';
        actionDetail = rawProject || rawDetails;
      } else if (isHesitation) {
        intentCategory = 'hesitation';
        actionDetail = rawDetails || 'Hovered on contact';
      } else if (isDeepEngaged) {
        intentCategory = 'deep_dwell';
        actionDetail = `Active presence for ${dwell}s`;
      } else if (isSectionView) {
        intentCategory = 'section';
        actionDetail = rawSection;
      } else if (isSessionStart) {
        intentCategory = 'session_start';
        actionDetail = rawSection || 'Home';
      }

      let journeyLabel = '';
      if (isLeadIntake) journeyLabel = `📝 Lead Submitted: ${trade}`;
      else if (isCallIntent) journeyLabel = `📞 Phone Tap: ${actionDetail}`;
      else if (isSmsIntent) journeyLabel = `💬 SMS Tap: ${actionDetail}`;
      else if (isScopeCalc) journeyLabel = `💰 Estimator: ${trade} ${ballpark ? '(' + ballpark + ')' : ''}`.trim();
      else if (eventType === 'project_inspect') journeyLabel = `🔨 Inspected: ${rawProject || rawDetails}`;
      else if (eventType === 'gallery_inspect') journeyLabel = `🖼️ Gallery: ${trade || rawDetails}`;
      else if (eventType === 'photo_scrub') journeyLabel = `🖼️ Photo Scrub: ${rawProject || rawDetails}`;
      else if (eventType === 'contact_hesitation') journeyLabel = `⏳ Hesitation: Hovered contact drawer`;
      else if (eventType === 'form_engage') journeyLabel = `✍️ Started input in form`;
      else if (eventType === 'scroll_milestone') journeyLabel = `📜 Scrolled to ${scrollDepth}%`;
      else if (isDeepEngaged) journeyLabel = `⏱️ Qualified Dwell (${dwell}s)`;
      else if (isSectionView) journeyLabel = `👀 Viewed section: ${rawSection}`;
      else if (isSessionStart) journeyLabel = `🚀 Landed on site: ${rawSection || 'Home'}`;

      if (!sessionState) {
        sessionState = {
          sid: sid,
          is_operator: isOperator,
          city: cfCity,
          region: cfRegion,
          postal: cfPostal,
          isp: cfIsp,
          is_warp: isWarp,
          network_type: networkType,
          device: device,
          referrer: attr.referrer || 'direct',
          utm_campaign: attr.utm_campaign || '',
          dwell_sec: dwell,
          scroll_depth: scrollDepth,
          section: rawSection,
          project_viewed: rawProject,
          trade: trade,
          ballpark: ballpark,
          has_phone_tap: isCallIntent,
          has_sms_tap: isSmsIntent,
          contact_hesitation: isHesitation,
          form_engaged: isFormEngage,
          photo_scrubs: (eventType === 'photo_scrub' || eventType === 'project_inspect') ? 1 : 0,
          is_lead: isLeadIntake,
          client_name: data.name || data.lead_name || '',
          contact: data.contact || data.phone || data.email || '',
          notes: data.notes || '',
          msg_ids: {},
          active_bot_token: null,
          last_edit: now,
          journey: journeyLabel ? [journeyLabel] : []
        };
      } else {
        if (isOperator) sessionState.is_operator = true;
        sessionState.dwell_sec = Math.max(sessionState.dwell_sec || 0, dwell);
        sessionState.scroll_depth = Math.max(sessionState.scroll_depth || 0, scrollDepth);
        sessionState.city = cfCity;
        sessionState.region = cfRegion;
        if (cfPostal) sessionState.postal = cfPostal;
        sessionState.is_warp = isWarp;
        sessionState.network_type = networkType;
        if (rawProject) sessionState.project_viewed = rawProject;
        if (rawSection && rawSection !== 'Home') sessionState.section = rawSection;
        if (trade && trade !== 'General') sessionState.trade = trade;
        if (ballpark) sessionState.ballpark = ballpark;
        if (isCallIntent) sessionState.has_phone_tap = true;
        if (isSmsIntent) sessionState.has_sms_tap = true;
        if (isHesitation) sessionState.contact_hesitation = true;
        if (isFormEngage) sessionState.form_engaged = true;
        if (eventType === 'photo_scrub' || eventType === 'project_inspect') {
          sessionState.photo_scrubs = (sessionState.photo_scrubs || 0) + 1;
        }

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

      sessionState.msg_ids = sessionState.msg_ids || {};
      if (sessionState.telegram_msg_id && !sessionState.msg_ids[GROUP_CHAT_ID]) {
        sessionState.msg_ids[GROUP_CHAT_ID] = sessionState.telegram_msg_id;
      }

      const cardText = formatSessionCard(sessionState, intentCategory, actionDetail);
      const replyMarkup = buildInlineKeyboard(sessionState);
      const botToken = candidateTokens[0];

      if (botToken) {
        for (const targetChatId of targets) {
          const existingMsgId = sessionState.msg_ids[targetChatId];

          if (!existingMsgId) {
            let msgId = null;
            // If supergroup and threadId configured, attempt thread delivery first
            if (targetChatId === GROUP_CHAT_ID && configuredThreadId) {
              try {
                const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: targetChatId,
                    message_thread_id: configuredThreadId,
                    text: cardText,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_markup: replyMarkup
                  })
                }).then(r => r.json());

                if (res?.ok && res.result?.message_id) {
                  msgId = res.result.message_id;
                }
              } catch (e) {
                console.warn('Telegram thread dispatch attempt error:', e);
              }
            }

            // Fallback or direct delivery without threadId
            if (!msgId) {
              try {
                const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: targetChatId,
                    text: cardText,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_markup: replyMarkup
                  })
                }).then(r => r.json());

                if (res?.ok && res.result?.message_id) {
                  msgId = res.result.message_id;
                } else {
                  console.error('Telegram dispatch failed for', targetChatId, res);
                }
              } catch (e) {
                console.error('Telegram dispatch exception for', targetChatId, e);
              }
            }

            if (msgId) {
              sessionState.msg_ids[targetChatId] = msgId;
              sessionState.active_bot_token = botToken;
            }
          } else {
            // In-place update of existing card
            const timeSinceLastEdit = now - (sessionState.last_edit || 0);
            const isImmediate = isLeadIntake || isCallIntent || isSmsIntent || isScopeCalc;
            if (isImmediate || timeSinceLastEdit >= 3000) {
              try {
                const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: targetChatId,
                    message_id: existingMsgId,
                    text: cardText,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_markup: replyMarkup
                  })
                }).then(r => r.json());

                if (!editRes?.ok) {
                  const desc = editRes?.description || '';
                  if (desc.includes('message to edit not found')) {
                    delete sessionState.msg_ids[targetChatId];
                  }
                }
              } catch (e) {
                console.error('Telegram editMessageText exception for', targetChatId, e);
              }
            }
          }
        }
        sessionState.last_edit = now;
      }

      // Persist session state into KV with 30-minute rolling TTL
      if (kv) {
        await kv.put(sessionKey, JSON.stringify(sessionState), { expirationTtl: 1800 }).catch(() => {});
      }
    }

    return makeTelemetryResponse({ success: true, logged_to_d1: true, vid, sid });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
