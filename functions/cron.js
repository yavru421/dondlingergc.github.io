// Wazeecha Weather — Cloudflare Workers Cron
// Runs every 15 min on CF edge. AI-powered, escalation-aware, zero local machine dependency.

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=44.3936&longitude=-89.8173&current=temperature_2m,precipitation,weather_code,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=America%2FChicago&wind_speed_unit=mph&precipitation_unit=inch&temperature_unit=fahrenheit';
const USGS_URL    = 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=05400760&parameterCd=00060,00065&siteStatus=all';
const NWS_URL     = 'https://api.weather.gov/alerts/active?point=44.3936,-89.8173';
const VAPID_PUBLIC_KEY = "BMb36GOhjyJJzODjpDxXhmv7PZxyR-e2miXbuOakZESk83z-TgtgobvOXYIWGkgaDTREY9A5XcaXDTBfWQToHOM";

// NWS event severity map → cooldown in ms (0 = always fire)
const NWS_COOLDOWNS = {
  'Tornado Warning':              0,
  'Tornado Watch':                15 * 60 * 1000,
  'Severe Thunderstorm Warning':  0,
  'Severe Thunderstorm Watch':    15 * 60 * 1000,
  'Flash Flood Warning':          0,
  'Flash Flood Watch':            15 * 60 * 1000,
  'Winter Storm Warning':         30 * 60 * 1000,
  'Winter Storm Watch':           60 * 60 * 1000,
  'Special Weather Statement':    15 * 60 * 1000,
};
const DEFAULT_NWS_COOLDOWN = 30 * 60 * 1000;

// ---- VAPID helpers ----
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function createVapidToken(audience, privateJwk) {
  const header  = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: 'mailto:john@dondlingergc.com' };
  const enc = (o) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(o)));
  const dataToSign = new TextEncoder().encode(`${enc(header)}.${enc(payload)}`);
  const key = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, key, dataToSign);
  return `${enc(header)}.${enc(payload)}.${base64UrlEncode(sig)}`;
}

async function pushToAll(env, title, body) {
  console.log(`[cron] PUSH: ${title} | ${body}`);
  await env.DB.prepare('INSERT INTO notifications (title, message, timestamp) VALUES (?, ?, ?)').bind(title, body, Date.now()).run();
  const { results: subs } = await env.DB.prepare('SELECT endpoint FROM subscriptions').all();
  if (!subs?.length) return;
  let privateJwk;
  try { privateJwk = JSON.parse(env.VAPID_PRIVATE_KEY); } catch { console.error('[cron] Bad VAPID key'); return; }
  await Promise.all(subs.map(async (row) => {
    try {
      const url = new URL(row.endpoint);
      const vapidToken = await createVapidToken(`${url.protocol}//${url.host}`, privateJwk);
      const res = await fetch(row.endpoint, {
        method: 'POST',
        headers: { 'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`, 'TTL': '86400', 'Content-Length': '0' },
      });
      if (res.status === 410 || res.status === 404) {
        await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(row.endpoint).run();
      }
    } catch (e) { console.error('[cron] push failed:', e.message); }
  }));
}

// ---- KV state ----
async function readState(env)        { try { const r = await env.CRON_STATE.get('state'); return r ? JSON.parse(r) : {}; } catch { return {}; } }
async function writeState(env, s)    { await env.CRON_STATE.put('state', JSON.stringify(s)); }

// ---- AI: generate notification text in John's voice ----
async function generateAlert(env, context) {
  // Fallback if AI is unavailable — just use the raw context string
  if (!env.AI) return context;
  try {
    const resp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You write push notification alerts for a Lake Wazeecha weather app. 
Your tone: direct, casual, no fluff. Like a friend who actually knows weather. 
Zero corporate speak. Contractions OK. Emojis used sparingly and only when genuinely useful.
Format: one sentence max, plain text. Examples:
- "⚡ Severe storm warning just dropped for Wood County. Get off the water NOW."
- "Gusts hitting 38mph at Wazeecha and climbing. Batten down."
- "Rain's stopped. Radar looks clear for at least the next hour."
- "🌪️ Tornado watch until 10pm. Take this one seriously."
Never say "our app" or "we". Never use exclamation marks more than once. Never be vague.`
        },
        {
          role: 'user',
          content: `Write a push notification for this situation: ${context}`
        }
      ],
      max_tokens: 80,
    });
    const text = resp?.response?.trim();
    return text || context;
  } catch (e) {
    console.error('[cron] AI failed, using fallback:', e.message);
    return context;
  }
}

// ---- Escalation detection ----
// Returns true if current value is higher than the rolling average of last N readings
function isEscalating(history = [], currentValue, threshold = 1.1) {
  if (history.length < 2) return true; // not enough data, let it through
  const avg = history.reduce((a, b) => a + b, 0) / history.length;
  return currentValue >= avg * threshold;
}

function pushHistory(history = [], value, maxLen = 4) {
  const updated = [...history, value];
  return updated.slice(-maxLen);
}

// ---- Main ----
export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(runChecks(env)); },
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/check-weather') {
      // Security: require a shared secret to prevent anonymous triggering of
      // the full cron pipeline (AI quota burn + push notification flood).
      // Set CRON_SECRET as a Cloudflare Worker Secret via:
      //   wrangler secret put CRON_SECRET
      // Then pass it in your trigger: -H "X-Cron-Secret: <value>"
      const providedSecret = request.headers.get('X-Cron-Secret');
      if (!env.CRON_SECRET || providedSecret !== env.CRON_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      ctx.waitUntil(runChecks(env));
      return new Response(JSON.stringify({ ok: true, triggered: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not found', { status: 404 });
  },
};

async function runChecks(env) {
  try {
    const [weatherRes, usgsRes, nwsRes] = await Promise.all([
      fetch(WEATHER_URL),
      fetch(USGS_URL),
      fetch(NWS_URL, { headers: { 'User-Agent': 'wazeecha-weather (contact@dondlingergc.com)' } }),
    ]);
    const [weather, usgs, nws] = await Promise.all([
      weatherRes.json(),
      usgsRes.json().catch(() => null),
      nwsRes.json().catch(() => null),
    ]);

    const current = weather?.current;
    const daily   = weather?.daily;
    if (!current || !daily) { console.error('[cron] No weather data'); return; }

    const state = await readState(env);
    const [todayDate, timePart] = current.time.split('T');
    const localHour = parseInt(timePart.split(':')[0], 10);
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // ---- 1. NWS ACTIVE ALERTS (highest priority, AI-voiced) ----
    if (nws?.features) {
      if (!state.sent_nws_alerts) state.sent_nws_alerts = {};
      for (const feature of nws.features) {
        const props   = feature.properties;
        const alertId = props.id || feature.id;
        if (!alertId) continue;
        const expires = props.expires ? new Date(props.expires).getTime() : now + ONE_HOUR;
        const cooldown = NWS_COOLDOWNS[props.event] ?? DEFAULT_NWS_COOLDOWN;
        const lastSent = state.sent_nws_alerts[alertId]?.sent || 0;
        if (now - lastSent < cooldown) continue; // still in cooldown

        const raw = `NWS issued a ${props.event} for Wood County / Lake Wazeecha area. ${props.headline || ''}`.trim();
        const body = await generateAlert(env, raw);
        await pushToAll(env, `⚠️ ${props.event}`, body);
        state.sent_nws_alerts[alertId] = { sent: now, expires };
      }
      // Prune expired
      for (const id of Object.keys(state.sent_nws_alerts)) {
        if (state.sent_nws_alerts[id].expires < now) delete state.sent_nws_alerts[id];
      }
    }

    // ---- 2. DAILY MORNING FORECAST ----
    if (localHour >= 7 && state.daily_forecast_sent_date !== todayDate) {
      const raw = `Today at Lake Wazeecha: high of ${daily.temperature_2m_max[0]}°F, low ${daily.temperature_2m_min[0]}°F, ${daily.precipitation_sum[0]} inches rain expected.`;
      const body = await generateAlert(env, raw);
      await pushToAll(env, '🌤️ Morning Forecast', body);
      state.daily_forecast_sent_date = todayDate;
    }

    // ---- 2b. DAILY PERSONA FORECAST GENERATION (WaZWeather AI) ----
    if (localHour >= 6 && state.ai_persona_forecast_date !== todayDate && env.AI) {
      const modes = ['fishing', 'construction', 'family', 'lake'];
      let forecastSummary = '';
      for(let i=0; i<3; i++) {
        if(!daily.time[i]) continue;
        forecastSummary += `Day ${i+1}: High ${daily.temperature_2m_max[i]}F, Low ${daily.temperature_2m_min[i]}F, Precip ${daily.precipitation_sum[i]}in. `;
      }

      for (const mode of modes) {
        const systemPrompt = `You are the Dondlinger Digital weather intelligence engine. You translate raw weather telemetry into direct, high-utility field verdicts for four specific personas: fishing (focusing on flow rate, moon, wind trends), lake (boating, wind gusts, safety), construction (OSHA wind limits, temperature limits for concrete pouring/safety), and family (outdoor play, UV safety, sunsets). 
Your output MUST be a valid JSON object matching this schema exactly:
{
  "emoji": "single emoji matching current condition",
  "label": "Short verdict label, e.g. Perfect Weather, High Wind Alert, Concrete Warning",
  "sub": "Under 12 words summary of current condition details",
  "color": "hex color code corresponding to hazard level (green #39ff14, info #38bdf8, warn #fbbf24, danger #ef4444)",
  "advice": "One sentence of direct, casual, field-oriented advice. Contractions OK. Zero corporate speak. Maximum utility.",
  "ai_forecast_narrative": "1-2 paragraphs of tactical, highly persona-specific forecasting for the next 3 days. Focus entirely on utility and actionable advice based on the provided forecast summary."
}
Keep answers concise, direct, and functional.`;

        const userPrompt = `Persona Mode: ${mode}
Telemetry: Temp ${current.temperature_2m}F, Wind Gusts ${current.wind_gusts_10m}mph, Weather Code ${current.weather_code}.
Forecast Summary: ${forecastSummary}`;

        try {
          const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            session_affinity: `waz-weather-${mode}`
          });
          
          let rawText = aiResponse?.response;
          if (!rawText && aiResponse?.result) rawText = aiResponse.result;
          if (rawText) {
             const cleanedText = JSON.stringify(JSON.parse(rawText));
             const cacheKey = `waz_ai_v2_${mode}_${todayDate}`;
             await env.CRON_STATE.put(cacheKey, cleanedText, { expirationTtl: 86400 });
          }
        } catch (err) {
          console.error(`[cron] AI persona generation failed for ${mode}`, err);
        }
      }
      state.ai_persona_forecast_date = todayDate;
    }

    // ---- 3. RAIN START/STOP (15-min cooldown + escalation-aware) ----
    const isRaining = current.precipitation > 0;
    if (!state.rain_history) state.rain_history = [];
    state.rain_history = pushHistory(state.rain_history, current.precipitation);

    const RAIN_COOLDOWN = 15 * 60 * 1000;
    if (isRaining && !state.is_raining && (now - (state.last_rain_start || 0)) > RAIN_COOLDOWN) {
      const raw = `Rain just started at Lake Wazeecha. Current: ${current.precipitation} inches in last 15 min.`;
      const body = await generateAlert(env, raw);
      await pushToAll(env, '🌧️ Rain Started', body);
      state.is_raining = true;
      state.last_rain_start = now;
    } else if (!isRaining && state.is_raining && (now - (state.last_rain_stop || 0)) > RAIN_COOLDOWN) {
      const body = await generateAlert(env, 'Rain has stopped at Lake Wazeecha. Radar looks clear for now.');
      await pushToAll(env, '🌤️ Rain Stopped', body);
      state.is_raining = false;
      state.last_rain_stop = now;
    }

    // ---- 4. THUNDERSTORM / SEVERE WEATHER (weather code >= 95) ----
    const isThunderstorm = current.weather_code >= 95;
    const THUNDERSTORM_COOLDOWN = 30 * 60 * 1000;
    if (isThunderstorm && !state.is_thunderstorm) {
      const raw = `Severe thunderstorms detected at Lake Wazeecha. Secure the site.`;
      const body = await generateAlert(env, raw);
      await pushToAll(env, '⚡ Thunderstorm Alert', body);
      state.is_thunderstorm = true;
      state.last_thunderstorm_alert = now;
    } else if (!isThunderstorm && state.is_thunderstorm) {
      state.is_thunderstorm = false;
    } else if (isThunderstorm && state.is_thunderstorm && (now - (state.last_thunderstorm_alert || 0)) > THUNDERSTORM_COOLDOWN) {
      const raw = `Thunderstorms continue at Lake Wazeecha. Wind gusts are ${current.wind_gusts_10m} mph.`;
      const body = await generateAlert(env, raw);
      await pushToAll(env, '⚡ Thunderstorm Update', body);
      state.last_thunderstorm_alert = now;
    }

    // ---- 5. WIND GUSTS (milestone + escalation-aware) ----
    const wind = current.wind_gusts_10m;
    if (state.wind_date !== todayDate) { state.wind_date = todayDate; state.highest_wind_gust_seen_today = 0; state.wind_history = []; }
    if (!state.wind_history) state.wind_history = [];
    state.wind_history = pushHistory(state.wind_history, wind);
    const highestGust = state.highest_wind_gust_seen_today || 0;
    let threshold = null;
    if (wind >= 50 && highestGust < 50) threshold = 50;
    else if (wind >= 35 && highestGust < 35) threshold = 35;
    else if (wind >= 25 && highestGust < 25) threshold = 25;
    else if (wind >= 15 && highestGust < 15) threshold = 15;

    if (threshold && isEscalating(state.wind_history, wind)) {
      const raw = `Wind gusts hitting ${wind}mph at Lake Wazeecha and escalating.`;
      const body = await generateAlert(env, raw);
      await pushToAll(env, '💨 High Winds', body);
      state.highest_wind_gust_seen_today = Math.max(highestGust, wind);
    }

    // ---- 5. USGS RIVER (once per day) ----
    if (usgs?.value?.timeSeries) {
      let discharge = null, gauge = null;
      for (const ts of usgs.value.timeSeries) {
        const code = ts.variable.variableCode[0].value;
        const vals = ts.values[0].value;
        if (vals?.length) {
          const v = parseFloat(vals[vals.length - 1].value);
          if (code === '00060') discharge = v;
          if (code === '00065') gauge = v;
        }
      }
      if (discharge > 10000 && state.last_high_discharge_alert !== todayDate) {
        const body = await generateAlert(env, `Wisconsin River discharge is critically high at ${discharge} cfs. Flood risk elevated.`);
        await pushToAll(env, '🌊 River Alert', body);
        state.last_high_discharge_alert = todayDate;
      }
      if (gauge > 15 && state.last_high_gauge_alert !== todayDate) {
        const body = await generateAlert(env, `Wisconsin River gauge height at ${gauge} ft — critically high. Watch the banks.`);
        await pushToAll(env, '🌊 River Gauge Critical', body);
        state.last_high_gauge_alert = todayDate;
      }
    }

    await writeState(env, state);

    // Prune notifications older than 30 days to keep table bounded
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    await env.DB.prepare('DELETE FROM notifications WHERE timestamp < ?').bind(thirtyDaysAgo).run();

    console.log('[cron] Done.');
  } catch (err) {
    console.error('[cron] Fatal:', err);
  }
}
