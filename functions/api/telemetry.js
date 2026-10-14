/**
 * dondlingergc.com — High-Signal Contractor Lead & Visitor Intelligence Engine
 * Standards:
 * 1. D1-backed single-card session coalescence (site_sessions.telegram_state_json) — 1 card per visitor session, updated in-place via editMessageText.
 * 2. Zero low-signal noise: Page loads, scrolls, and hovers log silently to D1. Telegram only alerts on real engagement (Lead, Call/Text tap, Estimator usage, Form typing, Project inspection, or 45s+ active read).
 * 3. Plain-English contractor summary: Shows exact trade priced, square footage, dollar ballpark, project photos viewed, and contact info.
 */

function resolveCorsOrigin(origin) {
  if (origin === 'https://dondlingergc.com' || /^https:\/\/([a-zA-Z0-9-]+\.)?dondlingergc\.com$/.test(origin)) {
    return origin;
  }
  return 'https://dondlingergc.com';
}

function parseDevice(ua) {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android Phone';
  if (/Macintosh/i.test(ua)) return 'Mac Desktop';
  if (/Windows/i.test(ua)) return 'Windows PC';
  return 'Web Browser';
}

function classifyNetwork(asOrg, isWarp) {
  if (isWarp) return 'Cloudflare WARP / VPN';
  if (!asOrg) return 'Local / Mobile ISP';
  const org = asOrg.toLowerCase();
  if (/charter|spectrum|tds|frontier|centurylink|comcast|brightspeed/i.test(org)) {
    return `Home Wi-Fi (${asOrg})`;
  }
  if (/verizon|t-mobile|at&t|uscellular|sprint/i.test(org)) {
    return `Mobile Cellular (${asOrg})`;
  }
  if (/wood county|wisconsin rapids|stevens point|marshfield|wausau|consolidated|mid-state|school|hospital|clinic/i.test(org)) {
    return `Commercial / Local Org (${asOrg})`;
  }
  if (/amazon|aws|google cloud|microsoft|azure|digitalocean|hetzner|ovh|linode|oracle/i.test(org)) {
    return `🤖 Cloud / Datacenter (${asOrg})`;
  }
  return asOrg;
}

function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function buildInlineKeyboard(session) {
  const buttons = [];
  if (session.contact && /[\d]{7,}/.test(session.contact.replace(/\D/g, ''))) {
    const rawNum = session.contact.replace(/\D/g, '');
    buttons.push([
      { text: `📞 Call ${session.contact}`, url: `tel:${rawNum}` },
      { text: `💬 Text ${session.contact}`, url: `sms:${rawNum}` }
    ]);
  }
  return buttons.length > 0 ? { inline_keyboard: buttons } : undefined;
}

function formatSessionCard(session) {
  const geo = `${session.city || 'Central WI'}, ${session.region || 'WI'}${session.postal ? ' ' + session.postal : ''}`;
  const timeOnSite = formatDuration(session.dwell_sec || 0);

  // Determine the clearest plain-English headline based on the highest-intent action so far
  let headline = '👀 <b>VISITOR CHECKING OUT SITE</b>';
  if (session.is_lead) {
    headline = '🔥 <b>NEW QUOTE REQUEST SUBMITTED</b>';
  } else if (session.has_sms_tap) {
    headline = '💬 <b>VISITOR TAPPED "TEXT US" (715-459-3050)</b>';
  } else if (session.has_phone_tap) {
    headline = '📞 <b>VISITOR TAPPED "CALL US" (715-459-3050)</b>';
  } else if (session.form_engaged) {
    headline = '✍️ <b>VISITOR TYPING IN QUOTE FORM</b>';
  } else if (session.ballpark) {
    headline = `💰 <b>PRICING OUT ${(session.trade || 'PROJECT').toUpperCase()}</b>`;
  } else if (session.project_viewed) {
    headline = '🔨 <b>LOOKING AT PROJECT PHOTOS</b>';
  } else if ((session.dwell_sec || 0) >= 45) {
    headline = `⏱️ <b>ACTIVE VISITOR ON SITE (${timeOnSite})</b>`;
  }

  const summaryLines = [];

  if (session.is_lead || session.contact || session.client_name) {
    if (session.client_name) summaryLines.push(`👤 <b>Name:</b> ${session.client_name}`);
    if (session.contact) summaryLines.push(`📞 <b>Phone/Email:</b> <code>${session.contact}</code>`);
    if (session.notes) summaryLines.push(`📝 <b>Notes:</b> ${session.notes}`);
  }

  if (session.ballpark || (session.trade && session.trade !== 'General')) {
    const specPart = session.calc_specs ? ` (${session.calc_specs})` : '';
    const pricePart = session.ballpark ? ` → <b>${session.ballpark}</b>` : '';
    summaryLines.push(`📐 <b>Estimator:</b> ${session.trade || 'General'}${specPart}${pricePart}`);
  }

  if (session.project_viewed) {
    const scrubs = (session.photo_scrubs || 0) > 1 ? ` (${session.photo_scrubs} photos viewed)` : '';
    summaryLines.push(`🖼️ <b>Project Viewed:</b> ${session.project_viewed}${scrubs}`);
  }

  const summaryBlock = summaryLines.length > 0
    ? `\n${summaryLines.join('\n')}\n`
    : '';

  const actions = (session.journey || []).slice(-6);
  const actionsBlock = actions.length > 0
    ? `\n<b>What they did:</b>\n${actions.map(a => `• ${a}`).join('\n')}\n`
    : '';

  const ref = session.referrer && session.referrer !== 'direct' ? ` • via ${session.referrer}` : '';

  return `${headline}\n` +
    `📍 ${geo} • ${session.device || 'Web'} • ${session.network_type || 'Local ISP'}\n` +
    `⏱️ Time on site: <b>${timeOnSite}</b>${ref}` +
    (summaryBlock ? `\n━━━━━━━━━━━━━━━━━━━━${summaryBlock}━━━━━━━━━━━━━━━━━━━━` : '') +
    actionsBlock;
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
  if (request.method !== 'POST') return new Response(JSON.stringify({ status: 'ready', engine: '2026-high-signal-coalesced' }), { status: 200, headers: corsHeaders });

  try {
    const data = await request.json().catch(() => ({}));
    const candidateTokens = [env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_APP_BOT_TOKEN].filter(Boolean);
    const PERSONAL_CHAT_ID = env.TELEGRAM_CHAT_ID || '8104595144';
    // Deliver to personal chat only by default so John doesn't get duplicate double-pings
    const targets = [PERSONAL_CHAT_ID];
    if (env.TELEGRAM_ENABLE_GROUP_MIRROR === 'true' && env.TELEGRAM_GROUP_CHAT_ID) {
      targets.push(env.TELEGRAM_GROUP_CHAT_ID);
    }

    const ua = request.headers.get('user-agent') || '';
    const cookieHeader = request.headers.get('cookie') || '';
    const vidCookieMatch = cookieHeader.match(/dgc_vid=([^;]+)/);
    const sidCookieMatch = cookieHeader.match(/dgc_sid=([^;]+)/);
    const vid = data.vid || (vidCookieMatch ? decodeURIComponent(vidCookieMatch[1]) : 'v_' + Math.random().toString(36).substring(2, 10));
    const sid = data.sid || (sidCookieMatch ? decodeURIComponent(sidCookieMatch[1]) : 's_' + Math.random().toString(36).substring(2, 10));
    const eventType = data.event || 'session_start';
    const section = data.section || data.tab || 'Home';
    const project = data.project || '';
    const trade = data.trade || 'General';
    const ballpark = data.ballpark || '';
    const details = data.details || '';
    const dwell = Number(data.dwell_sec || 0);
    const scrollDepth = Number(data.scroll_depth || 0);
    const attr = data.attribution || {};
    const tz = data.timezone || attr.timezone || '';

    let eventDomain = data.domain || '';
    if (!eventDomain && origin) {
      try { eventDomain = new URL(origin).hostname; } catch (e) {}
    }
    if (!eventDomain) {
      eventDomain = request.headers.get('host') || 'dondlingergc.com';
    }

    const isOperator = Boolean(data.is_operator || attr.is_operator);
    const isTestDispatch = Boolean(data.test_dispatch || attr.test_dispatch);

    const isBot = /bot|crawl|spider|slurp|censys|shodan|masscan|bytespider|gptbot|claudebot|headless|python-requests|aiohttp|wget|curl/i.test(ua);
    if (isBot && !isTestDispatch) {
      return new Response(JSON.stringify({ success: true, bot: true }), { status: 200, headers: corsHeaders });
    }

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
    if (networkType.includes('🤖 Cloud / Datacenter') && !isTestDispatch) {
      return new Response(JSON.stringify({ success: true, suppressed_datacenter: true }), { status: 200, headers: corsHeaders });
    }

    const device = parseDevice(ua);
    const rawSection = String(section || 'Home').slice(0, 255);
    const rawProject = String(project || '').slice(0, 255);
    const rawDetails = String(details || '').slice(0, 2000);

    // 1. Classify Event Intent & Build Plain-English Journey Line
    const isCallIntent = (eventType === 'intent_phone_dial' || eventType === 'call_button_click');
    const isSmsIntent = (eventType === 'intent_sms_dispatch' || eventType === 'sms_button_click');
    const isLeadIntake = (eventType === 'lead_intake' || Boolean(data.lead_name || data.contact));
    const isQuoteCta = (eventType === 'intent_quote_cta' || eventType === 'cta_estimate_click');
    const isScopeCalc = (eventType === 'calc_scope_change' && Boolean(ballpark || trade !== 'General'));
    const isProjectInspect = (eventType === 'project_inspect' || eventType === 'gallery_inspect' || eventType === 'photo_scrub');
    const isFormEngage = (eventType === 'form_engage');
    const isDeepEngaged = ((eventType === 'engaged_read' || eventType === 'deep_dwell_180s') && dwell >= 45);

    let journeyLabel = '';
    if (isLeadIntake) {
      journeyLabel = `🔥 Submitted quote request (${data.contact || trade || 'Lead'})`;
    } else if (isSmsIntent) {
      journeyLabel = `💬 Tapped Text Us (${rawDetails || '715-459-3050'})`;
    } else if (isCallIntent) {
      journeyLabel = `📞 Tapped Call (${rawDetails || '715-459-3050'})`;
    } else if (isScopeCalc) {
      const specs = rawDetails ? ` (${rawDetails})` : '';
      const range = ballpark ? `: ${ballpark}` : '';
      journeyLabel = `💰 Priced ${trade}${specs}${range}`;
    } else if (isFormEngage) {
      journeyLabel = `✍️ ${rawDetails || 'Started typing in quote form'}`;
    } else if (isQuoteCta) {
      journeyLabel = `⚡ ${rawDetails || 'Clicked Get a Price button'}`;
    } else if (eventType === 'project_inspect') {
      journeyLabel = `🔨 Viewed project: ${rawProject || rawDetails}`;
    } else if (eventType === 'gallery_inspect') {
      journeyLabel = `🖼️ ${rawDetails || ('Filtered gallery: ' + trade)}`;
    } else if (eventType === 'photo_scrub') {
      journeyLabel = `🖼️ Flipped through photos: ${rawProject || rawDetails}`;
    } else if (isDeepEngaged) {
      journeyLabel = `⏱️ Active on site for ${formatDuration(dwell)}`;
    }

    // 2. Load & Update Session State in D1 (Guaranteed Single-Card Coalescence)
    const trafficDb = env.TRAFFIC_DB || env.DB;
    let sessionState = null;

    if (trafficDb) {
      try {
        const existingRow = await trafficDb.prepare(
          `SELECT telegram_state_json FROM site_sessions WHERE session_id = ? LIMIT 1`
        ).bind(sid).first();
        if (existingRow && existingRow.telegram_state_json) {
          sessionState = JSON.parse(existingRow.telegram_state_json);
        }
      } catch (e) {}
    }

    const now = Date.now();
    if (!sessionState) {
      sessionState = {
        sid,
        domain: eventDomain,
        city: cfCity,
        region: cfRegion,
        postal: cfPostal,
        network_type: networkType,
        device,
        referrer: attr.referrer || 'direct',
        dwell_sec: dwell,
        scroll_depth: scrollDepth,
        project_viewed: rawProject || '',
        trade: trade !== 'General' ? trade : '',
        ballpark: ballpark || '',
        calc_specs: isScopeCalc ? rawDetails : '',
        has_phone_tap: isCallIntent,
        has_sms_tap: isSmsIntent,
        form_engaged: isFormEngage,
        photo_scrubs: isProjectInspect ? 1 : 0,
        is_lead: isLeadIntake,
        client_name: data.name || data.lead_name || '',
        contact: data.contact || data.phone || data.email || '',
        notes: data.notes || '',
        msg_ids: {},
        last_edit: 0,
        journey: journeyLabel ? [journeyLabel] : []
      };
    } else {
      sessionState.dwell_sec = Math.max(sessionState.dwell_sec || 0, dwell);
      sessionState.scroll_depth = Math.max(sessionState.scroll_depth || 0, scrollDepth);
      sessionState.city = cfCity;
      sessionState.region = cfRegion;
      if (cfPostal) sessionState.postal = cfPostal;
      sessionState.network_type = networkType;
      if (rawProject) sessionState.project_viewed = rawProject;
      if (trade && trade !== 'General') sessionState.trade = trade;
      if (ballpark) sessionState.ballpark = ballpark;
      if (isScopeCalc && rawDetails) sessionState.calc_specs = rawDetails;
      if (isCallIntent) sessionState.has_phone_tap = true;
      if (isSmsIntent) sessionState.has_sms_tap = true;
      if (isFormEngage) sessionState.form_engaged = true;
      if (isProjectInspect) sessionState.photo_scrubs = (sessionState.photo_scrubs || 0) + 1;

      if (isLeadIntake) {
        sessionState.is_lead = true;
        sessionState.client_name = data.name || data.lead_name || sessionState.client_name;
        sessionState.contact = data.contact || data.phone || data.email || sessionState.contact;
        sessionState.notes = data.notes || sessionState.notes;
      }

      if (journeyLabel) {
        sessionState.journey = sessionState.journey || [];
        const lastItem = sessionState.journey[sessionState.journey.length - 1];
        // Replace consecutive estimator slider moves so the list stays clean
        if (isScopeCalc && lastItem && lastItem.startsWith('💰 Priced ')) {
          sessionState.journey[sessionState.journey.length - 1] = journeyLabel;
        } else if (!sessionState.journey.includes(journeyLabel)) {
          sessionState.journey.push(journeyLabel);
          if (sessionState.journey.length > 6) sessionState.journey.shift();
        }
      }
    }

    // 3. Persist Event & Session State to D1
    if (trafficDb) {
      const nowIso = new Date().toISOString();
      const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown';
      const clientCountry = request.cf?.country || 'US';
      const clientAsn = cfIsp ? ('AS' + (request.cf?.asn || '')) : '';
      const clientColo = request.cf?.colo || 'ORD';

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
          sid, vid, eventType, eventDomain, rawProject || rawSection, rawSection,
          null, null, rawDetails ? JSON.stringify({ details: rawDetails }) : null, dwell, dwell,
          scrollDepth, 0, clientIp, clientCountry, cfRegion, cfCity, cfPostal,
          tz, clientAsn, cfIsp, clientColo, device, ua, attr.referrer || 'direct',
          attr.utm_source || '', attr.utm_campaign || '', nowIso,
          trade, ballpark, rawProject, networkType, isOperator ? 1 : 0
        ).run();

        await trafficDb.prepare(`
          INSERT INTO site_sessions (
            session_id, visitor_id, domain, ip, country, region, city, asn, isp_org, colo,
            device_type, user_agent, referrer, landing_page, identified_contact,
            first_seen, last_seen, duration_seconds, pageviews_count, plays_count, downloads_count,
            telegram_state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(session_id) DO UPDATE SET
            last_seen = excluded.last_seen,
            duration_seconds = MAX(site_sessions.duration_seconds, excluded.duration_seconds),
            pageviews_count = site_sessions.pageviews_count + excluded.pageviews_count,
            identified_contact = COALESCE(excluded.identified_contact, site_sessions.identified_contact),
            isp_org = COALESCE(site_sessions.isp_org, excluded.isp_org),
            telegram_state_json = excluded.telegram_state_json
        `).bind(
          sid, vid, eventDomain, clientIp, clientCountry, cfRegion, cfCity, clientAsn, cfIsp, clientColo,
          device, ua, attr.referrer || 'direct', rawSection, (data.contact || '').trim() || null,
          nowIso, nowIso, dwell, (eventType === 'session_start' || eventType === 'section_view') ? 1 : 0, 0, 0,
          JSON.stringify(sessionState)
        ).run();
      } catch (errD1) {
        console.error('D1 write error:', errD1);
      }

      try {
        await trafficDb.prepare(`
          INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(sid, eventType, rawProject || rawSection, trade, ballpark, dwell, isOperator ? 'Operator Console' : device, cfCity, cfRegion).run();
      } catch (errVt) {}
    }

    function makeTelemetryResponse(bodyObj, status = 200) {
      const respHeaders = new Headers(corsHeaders);
      const isDgcDomain = origin.includes('dondlingergc.com');
      const domainAttr = isDgcDomain ? '; Domain=.dondlingergc.com' : '';
      respHeaders.append('Set-Cookie', `dgc_vid=${encodeURIComponent(vid)}${domainAttr}; Path=/; SameSite=Lax; Secure; Max-Age=31536000`);
      respHeaders.append('Set-Cookie', `dgc_sid=${encodeURIComponent(sid)}${domainAttr}; Path=/; SameSite=Lax; Secure; Max-Age=1800`);
      return new Response(JSON.stringify(bodyObj), { status, headers: respHeaders });
    }

    // 4. STRICT HIGH-SIGNAL TELEGRAM GATING
    // Never spam Telegram on raw page load (session_start), scroll_milestone, hover hesitation, or operator self-browsing.
    if (isOperator && !isTestDispatch) {
      return makeTelemetryResponse({ success: true, logged_to_d1: true, suppressed_operator: true, vid, sid });
    }

    const isMeaningfulAction = isLeadIntake || isCallIntent || isSmsIntent || isScopeCalc || isFormEngage || isQuoteCta || isProjectInspect || isDeepEngaged || isTestDispatch;
    if (!isMeaningfulAction) {
      return makeTelemetryResponse({ success: true, logged_to_d1: true, silent_event: eventType, vid, sid });
    }

    // 5. Send Single Card (or Edit Existing Session Card In-Place)
    const botToken = candidateTokens[0];
    if (botToken && targets.length > 0) {
      const cardText = formatSessionCard(sessionState);
      const replyMarkup = buildInlineKeyboard(sessionState);
      sessionState.msg_ids = sessionState.msg_ids || {};
      let stateChanged = false;

      for (const targetChatId of targets) {
        const existingMsgId = sessionState.msg_ids[targetChatId];

        if (!existingMsgId) {
          try {
            const payload = {
              chat_id: targetChatId,
              text: cardText,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            };
            if (replyMarkup) payload.reply_markup = replyMarkup;

            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).then(r => r.json());

            if (res?.ok && res.result?.message_id) {
              sessionState.msg_ids[targetChatId] = res.result.message_id;
              sessionState.last_edit = now;
              stateChanged = true;
            }
          } catch (e) {
            console.error('Telegram sendMessage error:', e);
          }
        } else {
          // Edit the existing Telegram card in-place instead of sending a new notification
          const timeSinceLastEdit = now - (sessionState.last_edit || 0);
          const isUrgent = isLeadIntake || isCallIntent || isSmsIntent || isScopeCalc || isFormEngage;
          if (isUrgent || timeSinceLastEdit >= 2500) {
            try {
              const payload = {
                chat_id: targetChatId,
                message_id: existingMsgId,
                text: cardText,
                parse_mode: 'HTML',
                disable_web_page_preview: true
              };
              if (replyMarkup) payload.reply_markup = replyMarkup;

              await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              sessionState.last_edit = now;
              stateChanged = true;
            } catch (e) {
              console.error('Telegram editMessageText error:', e);
            }
          }
        }
      }

      // Save the new message_id back to D1 so subsequent actions in this session edit the same card!
      if (stateChanged && trafficDb) {
        await trafficDb.prepare(
          `UPDATE site_sessions SET telegram_state_json = ? WHERE session_id = ?`
        ).bind(JSON.stringify(sessionState), sid).run().catch(() => {});
      }
    }

    return makeTelemetryResponse({ success: true, logged_to_d1: true, vid, sid });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
