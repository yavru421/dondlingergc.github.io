import webpush from 'web-push';

export default {
  // CRON Trigger Handler
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.checkTelemetryAndAlert(env));
  },

  // HTTP Handler (for subscription updates & testing)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://dondlingergc.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/subscribe' && request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        // Schema validation
        if (!body || typeof body !== 'object') {
          return new Response(JSON.stringify({ error: 'Subscription data must be an object' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const { endpoint, keys, preferences } = body;
        if (!endpoint || typeof endpoint !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing or invalid endpoint' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        if (!keys || typeof keys !== 'object' || !keys.p256dh || !keys.auth || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing or invalid keys (keys.p256dh and keys.auth are required strings)' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        if (!preferences || typeof preferences !== 'object') {
          return new Response(JSON.stringify({ error: 'Missing or invalid preferences object' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const preferences_river = preferences.river ? 1 : 0;
        const preferences_aqi = preferences.aqi ? 1 : 0;
        const preferences_weather = preferences.weather ? 1 : 0;

        // Upsert into D1 subscriptions table
        await env.DB.prepare(`
          INSERT INTO subscriptions (endpoint, p256dh, auth, preferences_river, preferences_aqi, preferences_weather)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(endpoint) DO UPDATE SET
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            preferences_river = excluded.preferences_river,
            preferences_aqi = excluded.preferences_aqi,
            preferences_weather = excluded.preferences_weather
        `).bind(endpoint, keys.p256dh, keys.auth, preferences_river, preferences_aqi, preferences_weather).run();

        // Get updated count of subscribers
        const countRow = await env.DB.prepare('SELECT COUNT(*) as count FROM subscriptions').first();
        const count = countRow ? countRow.count : 0;

        return new Response(JSON.stringify({ success: true, count }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/unsubscribe' && request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const endpoint = body?.endpoint;
        if (!endpoint || typeof endpoint !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid or missing endpoint' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(endpoint).run();

        // Get updated count of subscribers
        const countRow = await env.DB.prepare('SELECT COUNT(*) as count FROM subscriptions').first();
        const count = countRow ? countRow.count : 0;

        return new Response(JSON.stringify({ success: true, count }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/trigger' || url.pathname === '/test') {
        // Manually run check
        const report = await this.checkTelemetryAndAlert(env);
        return new Response(JSON.stringify(report, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/broadcast' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${env.VAPID_PRIVATE_KEY}`) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const { title, message } = body;
        if (!message) {
          return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const vapidSubject = env.VAPID_SUBJECT || 'mailto:john@dondlingergc.com';
        const vapidPublicKey = env.VAPID_PUBLIC_KEY || 'BCPKbThp0d-QD3Ai8Y3eQuY54X4qsneKeJU8m05cbDcpC7Gks7GjXmONPy6e9Xs-NWtffzprS6Muyqvci7wJSPE';
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, env.VAPID_PRIVATE_KEY);

        const { results: subs } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM subscriptions').all();
        if (!subs || subs.length === 0) {
          return new Response(JSON.stringify({ success: true, count: 0, message: 'No subscribers found' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const payload = JSON.stringify({
          title: title || 'Admin Broadcast',
          body: message,
          data: { url: '/#wazeecha-telemetry', category: 'info', timestamp: Date.now() }
        });

        const sendPromises = subs.map(subRow => {
          return webpush.sendNotification({ endpoint: subRow.endpoint, keys: { p256dh: subRow.p256dh, auth: subRow.auth } }, payload)
            .catch(async (err) => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                try {
                  await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(subRow.endpoint).run();
                } catch(e) {}
              }
            });
        });

        await Promise.all(sendPromises);
        return new Response(JSON.stringify({ success: true, count: subs.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  },

  // Main Telemetry Processing Logic
  async checkTelemetryAndAlert(env) {
    const report = {
      timestamp: Date.now(),
      checked: { river: false, aqi: false, weather: false },
      alertsTriggered: [],
      errors: []
    };

    // VAPID keys setup
    const vapidSubject = env.VAPID_SUBJECT || 'mailto:john@dondlingergc.com';
    const vapidPublicKey = env.VAPID_PUBLIC_KEY || 'BCPKbThp0d-QD3Ai8Y3eQuY54X4qsneKeJU8m05cbDcpC7Gks7GjXmONPy6e9Xs-NWtffzprS6Muyqvci7wJSPE';
    const vapidPrivateKey = env.VAPID_PRIVATE_KEY; // Must be set in Cloudflare secrets

    if (!vapidPrivateKey) {
      report.errors.push('VAPID_PRIVATE_KEY is missing. Pushes will be simulated.');
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey || 'dummy-key-for-simulation');

    // Retrieve last cached state from D1
    let lastState = {
      cfs: null,
      gauge: null,
      aqi: null,
      wind_gust: null,
      precipitation: null,
      last_alert_time: {}
    };

    try {
      const stateRow = await env.DB.prepare('SELECT value FROM telemetry_state WHERE key = ?').bind('last_telemetry_state').first();
      if (stateRow && stateRow.value) {
        lastState = JSON.parse(stateRow.value);
      }
    } catch (err) {
      report.errors.push(`Failed to read telemetry_state: ${err.message}`);
    }

    const currentState = { ...lastState };

    // 1. Fetch USGS Hydrology
    try {
      const res = await fetch('https://waterservices.usgs.gov/nwis/iv/?format=json&sites=05400760&parameterCd=00060,00065&period=PT2H');
      const data = await res.json();
      
      let cfs = null, gauge = null;
      data?.value?.timeSeries?.forEach(series => {
        const code = series?.variable?.variableCode?.[0]?.value;
        const values = series.values[0].value;
        if (values && values.length > 0) {
          const val = parseFloat(values[values.length - 1].value);
          if (code === '00060') cfs = val;
          else if (code === '00065') gauge = val;
        }
      });

      if (cfs !== null) {
        currentState.cfs = cfs;
        currentState.gauge = gauge;
        report.checked.river = true;

        // Condition Check: Flood Stage Warning
        if (lastState.cfs !== null && cfs >= 25000 && lastState.cfs < 25000) {
          report.alertsTriggered.push({
            title: '⚠️ Wazeecha Flood Danger',
            body: `USGS Gauge indicates critical flow at ${cfs.toLocaleString()} CFS (${gauge.toFixed(2)} ft). Avoid low-lying river trails.`,
            category: 'safety_warning',
            type: 'river'
          });
        }
        // Condition Check: High Flow Caution
        else if (lastState.cfs !== null && cfs >= 15000 && lastState.cfs < 15000) {
          report.alertsTriggered.push({
            title: '🌊 High Flow Warning',
            body: `Wisconsin River flow has exceeded safety threshold: ${cfs.toLocaleString()} CFS. Use extreme caution near spillways.`,
            category: 'safety_warning',
            type: 'river'
          });
        }
        // Normal recovery alert
        else if (lastState.cfs !== null && cfs < 10000 && lastState.cfs >= 15000) {
          report.alertsTriggered.push({
            title: '✓ River Flow Normalizing',
            body: `Flow rate has subsided to ${cfs.toLocaleString()} CFS. Conditions are returning to normal.`,
            category: 'info',
            type: 'river'
          });
        }
      }
    } catch (err) {
      report.errors.push(`USGS Fetch Failed: ${err.message}`);
    }

    // 2. Fetch Air Quality Index (AQI)
    try {
      const res = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=44.3936&longitude=-89.8173&current=us_aqi');
      const data = await res.json();
      const aqi = data.current?.us_aqi;
      
      if (aqi !== undefined) {
        currentState.aqi = aqi;
        report.checked.aqi = true;

        // Transition from Good/Mod to Unhealthy
        if (lastState.aqi !== null && aqi > 100 && lastState.aqi <= 100) {
          report.alertsTriggered.push({
            title: '😷 Air Quality Advisory',
            body: `AQI has entered Unhealthy range at ${aqi}. Sensitive groups should limit outdoor exertion.`,
            category: 'safety_warning',
            type: 'aqi'
          });
        }
        // Transition from Good to Moderate
        else if (lastState.aqi !== null && aqi > 50 && aqi <= 100 && lastState.aqi <= 50) {
          report.alertsTriggered.push({
            title: '🍃 Moderate Air Quality',
            body: `AQI is currently ${aqi} (Moderate). A slight haze may be visible.`,
            category: 'info',
            type: 'aqi'
          });
        }
        // Returning to Good
        else if (lastState.aqi !== null && aqi <= 50 && lastState.aqi > 50) {
          report.alertsTriggered.push({
            title: '🍃 Air Quality Cleared',
            body: `AQI has improved back to Good levels: ${aqi}.`,
            category: 'info',
            type: 'aqi'
          });
        }
      }
    } catch (err) {
      report.errors.push(`AQI Fetch Failed: ${err.message}`);
    }

    // 3. Fetch Weather Alerts
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.3936&longitude=-89.8173&current=temperature_2m,wind_gusts_10m,precipitation&timezone=America%2FChicago&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch');
      const data = await res.json();
      const c = data.current;

      if (c) {
        currentState.wind_gust = c.wind_gusts_10m;
        currentState.precipitation = c.precipitation;
        report.checked.weather = true;

        // High Wind Alert
        if (lastState.wind_gust !== null && c.wind_gusts_10m >= 45 && lastState.wind_gust < 45) {
          report.alertsTriggered.push({
            title: '💨 Severe Wind Alert',
            body: `Peak wind gusts reached ${c.wind_gusts_10m} mph. Watch for falling branches or debris.`,
            category: 'safety_warning',
            type: 'weather'
          });
        }
        // Heavy Precipitation Warning
        if (lastState.precipitation !== null && c.precipitation >= 0.75 && lastState.precipitation < 0.75) {
          report.alertsTriggered.push({
            title: '🌧️ Heavy Rain Warning',
            body: `Heavy rainfall detected: ${c.precipitation} in/hr. Expect localized ponding on roadways.`,
            category: 'safety_warning',
            type: 'weather'
          });
        }
      }
    } catch (err) {
      report.errors.push(`Weather Fetch Failed: ${err.message}`);
    }

    // Update state cache in D1
    try {
      await env.DB.prepare('INSERT OR REPLACE INTO telemetry_state (key, value) VALUES (?, ?)')
        .bind('last_telemetry_state', JSON.stringify(currentState))
        .run();
    } catch (err) {
      report.errors.push(`Failed to save telemetry_state: ${err.message}`);
    }

    // Send push notifications if alerts triggered
    if (report.alertsTriggered.length > 0) {
      const sendPromises = [];

      for (const alert of report.alertsTriggered) {
        const payload = JSON.stringify({
          title: alert.title,
          body: alert.body,
          data: {
            url: '/#wazeecha-telemetry',
            category: alert.category,
            timestamp: Date.now()
          }
        });

        // Run D1 SQL query to get subscribers who have enabled specific categories
        let query = 'SELECT endpoint, p256dh, auth FROM subscriptions';
        if (alert.type === 'river') {
          query += ' WHERE preferences_river = 1';
        } else if (alert.type === 'aqi') {
          query += ' WHERE preferences_aqi = 1';
        } else if (alert.type === 'weather') {
          query += ' WHERE preferences_weather = 1';
        }

        let subs = [];
        try {
          const { results } = await env.DB.prepare(query).all();
          subs = results || [];
        } catch (err) {
          report.errors.push(`Failed to fetch subscribers for ${alert.type}: ${err.message}`);
          continue;
        }

        if (subs.length === 0) {
          continue;
        }

        if (!vapidPrivateKey) {
          report.errors.push(`Simulation Mode: Would have sent alert (${alert.title}) to ${subs.length} subscribers.`);
          continue;
        }

        subs.forEach(subRow => {
          const sub = {
            endpoint: subRow.endpoint,
            keys: {
              p256dh: subRow.p256dh,
              auth: subRow.auth
            }
          };

          const promise = webpush.sendNotification(sub, payload)
            .catch(async (err) => {
              // If subscription expired/unsubscribed (410 Gone / 404 Not Found), remove it
              if (err.statusCode === 410 || err.statusCode === 404) {
                try {
                  await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint = ?').bind(sub.endpoint).run();
                } catch (dbErr) {
                  // Ignore db errors in push callback to avoid breaking other notifications
                }
              }
              return { error: err.message, endpoint: sub.endpoint };
            });
          sendPromises.push(promise);
        });
      }

      if (sendPromises.length > 0) {
        const results = await Promise.all(sendPromises);
        report.dispatchResults = results;
        report.status = `Dispatched alerts to subscriber endpoints.`;
      } else {
        report.status = `No subscribers matched the triggered alerts categories.`;
      }
    } else {
      report.status = 'No alert conditions met.';
    }

    return report;
  }
};
