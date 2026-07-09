
    'use strict';

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Declare DOM variables to prevent strict mode ReferenceErrors
    const overlay = document.getElementById('dialog-overlay');
    const titleEl = document.getElementById('dialog-title-text');
    const screenshotContainer = document.getElementById('dialog-screenshot-container');
    const screenshotEl = document.getElementById('dialog-screenshot');
    const standardView = document.getElementById('standard-dialog-view');
    const telemetryView = document.getElementById('telemetry-dialog-view');
    const launchBtn = document.getElementById('dialog-launch-btn');
    const descEl = document.getElementById('dialog-desc');
    const audienceEl = document.getElementById('dialog-audience');

    /* App details database */
    const APP_DATA = {
      pourready: {
        title: 'PourReady // 01',
        accent: 'var(--accent-pour)',
        screenshot: 'img/pourready.png',
        desc: 'A field-tested concrete volume estimator built directly for jobsites. Precise calculations for slabs, footings, walls, and columns with custom waste safety margins.',
        who: ['Concrete Foremen', 'Contractors', 'Field Estimators'],
        link: './calc/index.html',
        btnLabel: 'Open PourReady'
      },
      shotstack: {
        title: 'ShotStack // 02',
        accent: 'var(--accent-shot)',
        screenshot: 'img/shotstackstudio_screenshot.PNG',
        desc: 'A storyboard compiler allowing video editors, film directors, and design teams to compile images, screenshots, and annotation notes into an exportable PDF layout.',
        who: ['Directors', 'Video Editors', 'Production Crew'],
        link: 'https://shotstackstudio.dondlingergc.com',
        btnLabel: 'Launch ShotStack'
      },
      tap: {
        title: 'TAP: Time & Place // 03',
        accent: 'var(--accent-tap)',
        screenshot: 'img/TAP_screenshot.PNG',
        desc: 'An authenticated, minimal field tracking protocol providing cryptographic proofs of location, activity, and duration directly from active project sites.',
        who: ['Field Supervisors', 'Auditors', 'Project Managers'],
        link: 'https://tap.dondlingergc.com',
        btnLabel: 'Launch TAP Protocol'
      },
      ampliloop: {
        title: 'AmpliLoop Studio // 04',
        accent: 'var(--accent-ampli)',
        screenshot: 'img/blazorcore.png',
        desc: 'A high-performance algorithmic rap beat generator, precise metronome, and software instrument tuner running locally via fast Blazor WebAssembly compiles.',
        who: ['Artists', 'Audio Engineers', 'Producers'],
        link: 'https://blazorpwa.dondlingergc.com',
        btnLabel: 'Launch AmpliLoop Studio'
      },
      aac: {
        title: 'Anytime Animal Control // 05',
        accent: 'var(--accent-aac)',
        screenshot: 'img/aac_preview.png',
        desc: 'Live wildlife removal and control service website. Provides field diagnostics, coverage maps, dispatch contacts, and pest management information.',
        who: ['Property Owners', 'Dispatchers', 'Field Technicians'],
        link: 'https://aac.dondlingergc.com',
        btnLabel: 'Launch AAC Portal'
      },
      intake: {
        title: 'Dondlinger Intake App // 06',
        accent: 'var(--accent-intake)',
        screenshot: 'img/intake_preview.png',
        desc: 'Live client onboarding and project intake utility. Captures property dimensions, budget estimations, and custom project scopes directly from prospective clients.',
        who: ['Prospective Clients', 'Estimators', 'Project Leads'],
        link: 'https://intakeapp.dondlingergc.com',
        btnLabel: 'Open Intake App'
      },
      omw: {
        title: 'On My Way (OMW) // 05',
        accent: '#f43f5e',
        screenshot: 'img/omw_preview.png',
        desc: 'Live GPS and ETA broadcasting tool. Allows field technicians and contractors to securely share live travel status and exact arrival times with project managers and clients.',
        who: ['Field Technicians', 'Project Managers', 'Clients'],
        link: 'https://omw.dondlingergc.com',
        btnLabel: 'Launch OMW Tracker'
      },
      zla: {
        title: 'Zero Liability Architecture, by DondlingerDigital // 08',
        accent: 'var(--accent-zla)',
        screenshot: '',
        desc: 'A software architecture that runs high-impact business utilities entirely within your browser. Because no data is ever uploaded to a server, there are no accounts, no logins, and zero risk of a data breach. Process your data lightning-fast, and the moment you close the tab, it dissolves completely.',
        who: ['Clients', 'Users'],
        link: 'https://zla.dondlingergc.com',
        btnLabel: 'Launch ZLA'
      },
      heckler: {
        title: 'Heckler // 09',
        accent: 'var(--accent-heckler)',
        screenshot: '',
        desc: 'Heckler Web Application.',
        who: ['Clients', 'Users'],
        link: 'https://heckler.dondlingergc.com',
        btnLabel: 'Launch Heckler'
      },
      timeline: {
        title: 'TimelineZLA // 10',
        accent: 'var(--accent-timeline)',
        screenshot: '',
        desc: 'A secure, local-first daily log and project timeline builder. Running entirely on Zero-Liability Architecture (ZLA), it enables teams to construct, update, and peer-to-peer sync site timelines via secure 6-digit codes with absolute data privacy and instant PDF export.',
        who: ['Field Superintendents', 'Project Managers', 'Field Crews'],
        link: 'https://timelinezla.dondlingergc.com',
        btnLabel: 'Launch TimelineZLA'
      },
      installguide: {
        title: 'Installation Guide // 07',
        accent: '#38bdf8',
        screenshot: '',
        desc: 'Video tutorial: How to install a Dondlinger Digital App.',
        who: ['All Users', 'Field Crews', 'Clients'],
        link: 'videos/0001-0861.mp4',
        btnLabel: 'Play Video'
      },
      dashboard: {
        title: 'Field Operations HUD // 05',
        accent: 'var(--accent-info)',
        screenshot: '',
        desc: 'A live dashboard pulling environmental telemetry and USGS streamflow diagnostics for regional project management and outdoor logistics coordinates.',
        who: ['Field Superintendents', 'Surveyors', 'Logistics Managers'],
        link: '#',
        btnLabel: 'Close HUD Details'
      }
    };

    /* Cache for live variables */
    let telemetryCache = {
      cfs: 15700,
      gauge: 10.42,
      aqi: 20,
      pm10: 0,
      pm25: 0,
      uv: 0
    };

    /* Mouse Spotlight Shine Effect */
    const cards = document.querySelectorAll('.glow-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });

    /* Inline Dashboard Toggle */
    const sentinelCard = document.querySelector('[data-app="sentinel"]');
    const sentinelContainer = document.getElementById('sentinel-dashboard-container');
    if (sentinelCard && sentinelContainer) {
      sentinelCard.addEventListener('click', () => {
        if (sentinelContainer.style.display === 'none') {
          sentinelContainer.style.display = 'block';
          document.querySelector('[data-app="sentinel"] .card-cta').textContent = 'Collapse Telemetry ⟵';
        } else {
          sentinelContainer.style.display = 'none';
          document.querySelector('[data-app="sentinel"] .card-cta').textContent = 'More Telemetry ⟶';
        }
      });
    }

    /* ============================================================ */
    /* WAZEECHA WEATHER (WaZWeather) PERSONA & VERDICT SYSTEM        */
    /* ============================================================ */

    let currentMode = localStorage.getItem('waz_weather_mode') || 'fishing';
    let globalWxData = null;

    function setWeatherMode(mode) {
      currentMode = mode;
      localStorage.setItem('waz_weather_mode', mode);

      // Update button active UI states
      document.querySelectorAll('.persona-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.getElementById('btn-mode-' + mode);
      if (activeBtn) activeBtn.classList.add('active');

      // Re-trigger visual cards render
      if (globalWxData) {
        renderLakeCard(globalWxData);
        renderForecastTrack(globalWxData);
      }
    }

    // Handle circumstances portal selection click
    function selectPortalMode(mode) {
      setWeatherMode(mode);
      scrollToWazCard('card-now'); // Scroll to Current Conditions card
    }

    // Rules engine for mode-based verdicts
    function getModeVerdict(mode, windGusts, precipProb, weatherCode, uvMax) {
      if (weatherCode >= 95) return { emoji: '⚡', label: 'Storm Warning', sub: 'Lightning risk & heavy storms', color: '#ef4444' };
      if (weatherCode >= 71 && weatherCode <= 77) return { emoji: '❄️', label: 'Snow Advisory', sub: 'Snow/freezing precip active', color: '#38bdf8' };

      if (mode === 'fishing') {
        if (windGusts > 22) return { emoji: '🌊', label: 'Rough Waves', sub: 'Strong wind - fish near shore lines', color: '#f97316' };
        if (precipProb > 65) return { emoji: '🌧️', label: 'Wet Casts', sub: 'Heavy rain - fish might go deep', color: '#6366f1' };
        if (windGusts < 12 && precipProb < 20) return { emoji: '🎣', label: 'Prime Casting', sub: 'Calm waters, high bite chance', color: '#39ff14' };
        return { emoji: '🐟', label: 'Fishing Day', sub: 'Manageable breeze & conditions', color: '#38bdf8' };
      }
      
      if (mode === 'construction') {
        if (windGusts > 20) return { emoji: '🏗️', label: 'High Wind Limit', sub: 'Wind > 20 mph - crane & roof limits', color: '#ef4444' };
        if (precipProb > 60) return { emoji: '🌧️', label: 'No Pour Day', sub: 'Rain expected - avoid concrete/paint', color: '#f97316' };
        if (weatherCode >= 51 && weatherCode <= 57) return { emoji: '🌫️', label: 'Drizzle Risk', sub: 'Wet surfaces - watch traction', color: '#eab308' };
        return { emoji: '🔨', label: 'Build Approved', sub: 'Dry conditions - safe for outdoor work', color: '#39ff14' };
      }

      if (mode === 'family') {
        if (uvMax >= 7) return { emoji: '☀️', label: 'Extreme UV', sub: 'Sunscreen required - seek afternoon shade', color: '#f97316' };
        if (precipProb > 40) return { emoji: '🏖️', label: 'Indoor Play', sub: 'Showers expected - plan indoors', color: '#6366f1' };
        if (uvMax < 3 && weatherCode >= 1 && weatherCode <= 3) return { emoji: '🌥️', label: 'Overcast Play', sub: 'Good for playground/walks', color: '#38bdf8' };
        return { emoji: '🧺', label: 'Picnic Perfect', sub: 'Beautiful sky - head to Red Sands!', color: '#39ff14' };
      }

      // Default/Lake Weekend Mode
      if (windGusts > 25) return { emoji: '🌊', label: 'Rough Water', sub: `Gusts to ${Math.round(windGusts)} mph - whitecaps`, color: '#f97316' };
      if (precipProb > 70) return { emoji: '🌧️', label: 'Cabin Day', sub: 'Heavy rain expected', color: '#6366f1' };
      if (windGusts < 10 && precipProb < 20) return { emoji: '⛵', label: 'Perfect Boating', sub: 'Mirror lake, perfect launch', color: '#39ff14' };
      return { emoji: '⛵', label: 'Lake Day', sub: 'Decent water, moderate wind', color: '#38bdf8' };
    }

    // Forward legacy call to getModeVerdict
    function getLakeVerdict(windGusts, precipProb, weatherCode, uvMax) {
      return getModeVerdict(currentMode, windGusts, precipProb, weatherCode, uvMax);
    }

    // Action recommendations generator based on meteorological parameters
    function getActionAdvice(mode, windSpd, windGusts, precipProb, weatherCode, uvMax, feelsLike) {
      const isWet = precipProb > 40 || (weatherCode >= 51 && weatherCode <= 67) || weatherCode >= 95;
      const isCold = feelsLike < 55;
      const isHot = feelsLike > 85;

      if (mode === 'fishing') {
        if (weatherCode >= 95) return "⛈️ Heavy storms & lightning risk. STOPOVER IMMEDIATELY. Stay off the water.";
        if (windGusts > 22) return "💨 Wind gusts hitting over 20mph. Target sheltered coves on the leeward sides of the pine lines.";
        if (isWet) return "🌧️ Steady rain. Bass and walleye will likely dive deeper or hold tighter to structure. Use slow jigs.";
        if (windSpd < 8) return "🎣 Perfect calm. Topwater lures, frogs, and spinnerbaits should produce excellent results today.";
        return "🐟 Decent fishing conditions. Focus weedlines and depth drops off the points.";
      }

      if (mode === 'construction') {
        if (weatherCode >= 95) return "⚡ Critical Lightning Threat. Evacuate steel structures, scaffolding, and cranes immediately.";
        if (windGusts > 20) return "⚠️ High wind advisory. Crane lifting, roofing, and siding work should be suspended (exceeds 20mph).";
        if (isWet) return "🌧️ Wet conditions. Avoid exterior painting, staining, or pouring concrete. Watch for muddy traction limits.";
        if (isCold) return "🥶 Cold temperatures. Ensure proper cure times for adhesives and mortar. Keep crews rotated.";
        return "🔨 Green Light. Dry conditions and manageable winds are ideal for all framing, roofing, and grading operations.";
      }

      if (mode === 'family') {
        if (weatherCode >= 95) return "⛈️ Severe weather in area. Cancel outdoor plans. Head to indoor shelters.";
        if (isWet) return "🌧️ Rain is highly likely. Great day to check out local indoor recreation or museum exhibits.";
        if (uvMax >= 7) return "☀️ Extreme Sun Intensity. Sunscreen (SPF 30+) is mandatory. Plan swim times early or seek pine shade after noon.";
        if (isCold) return "🧥 Brisk temperatures. Bring windbreakers and sweaters if walking the trails or beaches.";
        return "🧺 Phenomenal day for a picnic or trail hike! Head out to Red Sands beach and enjoy the lake views.";
      }

      // Lake / Recreation Mode
      if (weatherCode >= 95) return "⛈️ Storms approaching. Get off the open water. Secure watercraft lines.";
      if (windGusts > 25) return "🌊 Whitecap waves warning. Boat rentals and small watercraft should remain docked.";
      if (isWet) return "🌧️ Unsettled weather. Pack towels and wind protection; watch radar for sudden squalls.";
      if (isHot) return "🥵 High heat index. Keep hydrated. Excellent day for tubing, skiing, or floating in the water.";
      return "⛵ Safe boating and recreation conditions. Perfect day to enjoy the Wisconsin River valley.";
    }

    // Moon phase (Julian date formula, accurate ±1 day)
    function getMoonPhase(date) {
      const jd = (date.getTime() / 86400000) + 2440587.5;
      const phase = ((jd - 2451550.1) % 29.530588853 + 29.530588853) % 29.530588853;
      const idx = Math.round((phase / 29.530588853) * 8) % 8;
      return ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'][idx];
    }

    // Relative time formatter
    function relativeTime(tsMs) {
      const diff = Math.round((Date.now() - tsMs) / 60000);
      if (diff < 1) return 'Just now';
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(-diff, 'minute');
    }

    // Cardinal wind direction
    function degToCardinal(deg) {
      const dirs = ['N','NE','E','SE','S','SW','W','NW'];
      return dirs[Math.round(deg / 45) % 8];
    }

    /* ============================================================ */
    /* NEW DATA FETCHES                                              */
    /* ============================================================ */

    // Fetch KISW (Alexander Field) live surface observation
    async function fetchKISW() {
      const CACHE_KEY = 'kisw_obs_v1';
      const KISW_TTL  = 55 * 60 * 1000;
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < KISW_TTL) return parsed.data;
      }
      const res = await fetch('https://api.weather.gov/stations/KISW/observations/latest', {
        headers: { 'User-Agent': '(dondlingergc.com, dondlinger@example.com)' }
      });
      const json = await res.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: json.properties }));
      return json.properties;
    }

    // Fetch NWS active alerts for Wood County, WI (WIZ030)
    async function fetchNWSAlerts() {
      const CACHE_KEY = 'nws_alerts_v1';
      const ALERTS_TTL = 5 * 60 * 1000;
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < ALERTS_TTL) return { features: parsed.data, ts: parsed.ts };
      }
      const res = await fetch('https://api.weather.gov/alerts/active?zone=WIZ030', {
        headers: { 'User-Agent': '(dondlingergc.com, dondlinger@example.com)' }
      });
      const json = await res.json();
      const features = json.features || [];
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: features }));
      return { features, ts: Date.now() };
    }

    // Fetch NWS AHPS river stage forecast for WRRW3
    async function fetchRiverStage() {
      const CACHE_KEY = 'ahps_stage_v1';
      const AHPS_TTL  = 60 * 60 * 1000;
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < AHPS_TTL) return parsed.data;
      }
      try {
        const res = await fetch('https://api.water.noaa.gov/nwps/v1/gauges/WRRW3/stageflow');
        const json = await res.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: json }));
        return json;
      } catch(e) {
        console.warn('AHPS stage fetch failed:', e);
        return null;
      }
    }

    // Render the lake conditions card with dynamic persona configurations
    async function renderLakeCard(wxData) {
      try {
        globalWxData = wxData;
        const now = new Date();
        const todayIdx = 0; // first daily entry = today
        const h = wxData.hourly;
        const d = wxData.daily;

        // Find current hour index
        let curHr = 0;
        for (let i = 0; i < h.time.length; i++) {
          if (new Date(h.time[i]) <= now) curHr = i;
          else break;
        }

        const feelsLike  = h.apparent_temperature ? Math.round(h.apparent_temperature[curHr]) : null;
        const windSpd    = h.wind_speed_10m ? Math.round(h.wind_speed_10m[curHr]) : null;
        const windDir    = h.wind_direction_10m ? degToCardinal(h.wind_direction_10m[curHr]) : '--';
        const uvMax      = d.uv_index_max ? d.uv_index_max[todayIdx] : null;
        const precipProb = d.precipitation_probability_max ? d.precipitation_probability_max[todayIdx] : 0;
        const gustMax    = d.wind_gusts_10m_max ? d.wind_gusts_10m_max[todayIdx] : 0;
        const wCode      = d.weather_code ? d.weather_code[todayIdx] : 0;
        const sunrise    = d.sunrise ? new Date(d.sunrise[todayIdx]).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : '--';
        const sunset     = d.sunset ? new Date(d.sunset[todayIdx]).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : '--';

        // Populate telemetry payload & local storage cache logic
        let riverFlow = null;
        let riverStage = null;
        try {
          const cachedHydro = localStorage.getItem('usgs_hydro_cache_v2');
          if (cachedHydro) {
            const parsed = JSON.parse(cachedHydro);
            if (parsed && parsed.data && parsed.data.value && parsed.data.value.timeSeries) {
              parsed.data.value.timeSeries.forEach(series => {
                const code = series.variable.variableCode[0].value;
                const vals = series.values[0].value;
                if (vals && vals.length > 0) {
                  const currentVal = parseFloat(vals[vals.length - 1].value);
                  if (code === '00060') riverFlow = currentVal;
                  else if (code === '00065') riverStage = currentVal;
                }
              });
            }
          }
        } catch (e) {
          console.warn("Failed to parse USGS cache in renderLakeCard:", e);
        }

        let forecastSummary = '';
        for(let i=0; i<3; i++) {
          if(!d.time[i]) continue;
          forecastSummary += `Day ${i+1}: High ${d.temperature_2m_max[i]}F, Low ${d.temperature_2m_min[i]}F, Precip ${d.precipitation_sum[i]}in. `;
        }

        const payload = {
          mode: currentMode,
          temperature: h.temperature_2m ? Math.round(h.temperature_2m[curHr]) : null,
          apparent_temperature: feelsLike,
          wind_speed: windSpd,
          wind_gusts: gustMax,
          weather_code: wCode,
          uv_index: uvMax,
          river_flow: riverFlow,
          river_stage: riverStage,
          forecast_summary: forecastSummary
        };

        const el = id => document.getElementById(id);

        function applyLocalVerdict() {
          const localVerdict = getModeVerdict(currentMode, gustMax, precipProb, wCode, uvMax);
          const adviceText = getActionAdvice(currentMode, windSpd, gustMax, precipProb, wCode, uvMax, feelsLike || 70);
          
          el('lake-verdict-emoji').textContent = localVerdict.emoji;
          el('lake-verdict-label').textContent = localVerdict.label;
          el('lake-verdict-label').style.color = localVerdict.color;
          el('lake-verdict-sub').textContent = localVerdict.sub;
          el('lake-glow-orb').style.background = localVerdict.color;
          el('waz-advice-content').textContent = adviceText;
        }

        // Reset label defaults
        el('label-feels').textContent = 'Feels Like';
        el('label-wind').textContent = 'Wind';
        el('label-uv').textContent = 'UV Max';

        // Apply Persona dynamic swaps
        if (currentMode === 'fishing') {
          el('label-uv').textContent = 'Moon Phase';
          el('lake-uv').textContent = getMoonPhase(now);
          el('lake-uv').style.color = '#38bdf8';
          if (feelsLike !== null) el('lake-feels').textContent = feelsLike + '°';
        } else if (currentMode === 'construction') {
          el('label-feels').textContent = 'AQI Index';
          const aqiVal = el('metric-aqi') ? el('metric-aqi').textContent : '26';
          el('lake-feels').textContent = aqiVal;
          if (uvMax !== null) el('lake-uv').textContent = uvMax.toFixed(1);
          el('lake-uv').style.color = '#fbbf24';
        } else {
          // Lake & Family defaults
          if (feelsLike !== null) el('lake-feels').textContent = feelsLike + '°';
          if (uvMax !== null) el('lake-uv').textContent = uvMax.toFixed(1);
          el('lake-uv').style.color = '#fbbf24';
        }

        if (windSpd !== null) el('lake-wind').textContent = windSpd + ' mph';
        el('lake-wind-dir').textContent = windDir;
        el('lake-sunrise').textContent = sunrise;
        el('lake-sunset').textContent = sunset;
        el('lake-updated-stamp').textContent = relativeTime(Date.now());

        // Fetch Edge AI verdict with caching & local fallback
        let aiSuccess = false;
        try {
          const cacheKey = `last_verdict_${currentMode}`;
          const localCache = localStorage.getItem(cacheKey);
          const payloadHash = `${payload.mode}_${payload.temperature}_${payload.wind_speed}_${payload.wind_gusts}_${payload.weather_code}_${payload.uv_index}_${payload.river_flow}`;
          
          if (localCache) {
            const cachedObj = JSON.parse(localCache);
            if (cachedObj.hash === payloadHash && (Date.now() - cachedObj.timestamp < 15 * 60 * 1000)) {
              const v = cachedObj.verdict;
              el('lake-verdict-emoji').textContent = v.emoji;
              el('lake-verdict-label').textContent = v.label;
              el('lake-verdict-label').style.color = v.color;
              el('lake-verdict-sub').textContent = `${v.sub} (cached)`;
              el('lake-glow-orb').style.background = v.color;
              el('waz-advice-content').textContent = v.advice;
              if (v.ai_forecast_narrative) el('waz-ai-readout').textContent = v.ai_forecast_narrative;
              aiSuccess = true;
            }
          }

          if (!aiSuccess) {
            el('lake-verdict-sub').textContent = "Consulting Edge AI...";
            el('waz-advice-content').textContent = "Edge AI is analyzing current conditions...";

            const res = await fetch('/functions/weather-ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              const verdict = await res.json();
              el('lake-verdict-emoji').textContent = verdict.emoji || '🌤️';
              el('lake-verdict-label').textContent = verdict.label || 'Fair';
              el('lake-verdict-label').style.color = verdict.color || '#39ff14';
              el('lake-verdict-sub').textContent = verdict.sub || 'No alerts active';
              el('lake-glow-orb').style.background = verdict.color || '#39ff14';
              el('waz-advice-content').textContent = verdict.advice || '';
              if (verdict.ai_forecast_narrative) el('waz-ai-readout').textContent = verdict.ai_forecast_narrative;

              localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                hash: payloadHash,
                verdict: verdict
              }));
              aiSuccess = true;
            } else {
              console.warn("AI endpoint returned error status:", res.status);
            }
          }
        } catch (e) {
          console.error("AI verdict query failed:", e);
        }

        if (!aiSuccess) {
          applyLocalVerdict();
          const currentSub = el('lake-verdict-sub').textContent;
          el('lake-verdict-sub').textContent = `${currentSub} (Offline Fallback)`;
        }

        // Fetch KISW for visibility
        try {
          const kisw = await fetchKISW();
          const visM  = kisw.visibility && kisw.visibility.value;
          const visMi = visM ? (visM / 1609.34).toFixed(1) + ' mi' : '--';
          el('lake-visibility').textContent = 'Visibility: ' + visMi + ' (KISW)';
          // Feels-like from KISW if available (only if feels-like is the active display)
          if (kisw.heatIndex && kisw.heatIndex.value && feelsLike === null && currentMode !== 'construction') {
            el('lake-feels').textContent = Math.round((kisw.heatIndex.value * 9/5) + 32) + '°';
          }
        } catch(e) { /* KISW optional */ }

      } catch(err) {
        console.warn('Lake card render error:', err);
      }
    }

    // Render 5-day forecast cards dynamically based on selected mode
    function renderForecastTrack(wxData) {
      if (!wxData) return;
      const h = wxData.hourly;
      const days = {};
      h.time.forEach((t, index) => {
        const dateObj = new Date(t);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!days[dateStr]) {
          days[dateStr] = {
            temps: [],
            precips: [],
            winds: [],
            codes: [],
            workPrecips: [],
            workWinds: [],
            workCodes: [],
            rawTime: t,
            startIndex: index  // FIX 4: track global start index for this day
          };
        }
        days[dateStr].temps.push(h.temperature_2m[index]);
        days[dateStr].precips.push(h.precipitation[index]);
        days[dateStr].winds.push(h.wind_gusts_10m[index]);
        days[dateStr].codes.push(h.weather_code[index]);
        
        if (dateObj.getHours() <= 18) {
          days[dateStr].workPrecips.push(h.precipitation[index]);
          days[dateStr].workWinds.push(h.wind_gusts_10m[index]);
          days[dateStr].workCodes.push(h.weather_code[index]);
        }
      });

      const weatherTrack = document.getElementById('weather-forecast-track');
      if (weatherTrack) {
        weatherTrack.innerHTML = Object.keys(days).slice(0, 5).map((dayKey, dayIdx) => {
          const dayData = days[dayKey];
          const maxTemp = Math.max(...dayData.temps);
          const minTemp = Math.min(...dayData.temps);
          const totalPrecip = dayData.precips.reduce((sum, val) => sum + val, 0);
          const maxWind = Math.max(...dayData.winds);
          
          const workPrecipTotal = dayData.workPrecips.reduce((sum, val) => sum + val, 0);
          const maxWorkWind = dayData.workWinds.length > 0 ? Math.max(...dayData.workWinds) : 0;
          const validWorkCodes = dayData.workCodes.filter(c => c !== null);
          const worstWorkCode = validWorkCodes.length > 0 ? Math.max(...validWorkCodes) : 0;

          // FIX 3: use real daily precipitation_probability_max and uv_index_max
          const precipProb = wxData.daily && wxData.daily.precipitation_probability_max
            ? (wxData.daily.precipitation_probability_max[dayIdx] ?? 0)
            : Math.round(workPrecipTotal > 0.05 ? 80 : 10); // fallback only
          const uvMax = wxData.daily && wxData.daily.uv_index_max
            ? (wxData.daily.uv_index_max[dayIdx] ?? 0)
            : 5; // fallback only

          const lv = getModeVerdict(currentMode, maxWorkWind, precipProb, worstWorkCode, uvMax);
          const statusText  = lv.label;
          const statusColor = lv.color;

          // FIX 4: use stored startIndex instead of O(n) indexOf + correct dead-code rainHours
          let rainHours = [];
          dayData.precips.forEach((p, idx) => {
            if (p > 0.01) {
              const globalIdx = dayData.startIndex + idx;
              if (globalIdx < h.time.length) {
                const idxTime = new Date(h.time[globalIdx]);
                const hourFormatted = idxTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                rainHours.push(hourFormatted);
              }
            }
          });
          const rainHoursHtml = rainHours.length > 0
            ? `<div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Rain at</div><div style="color:#bae6fd; font-size:0.8rem; font-weight:600;">${rainHours.join(', ')}</div>`
            : '';
          
          const moon = getMoonPhase(new Date(dayData.rawTime));
          return `
          <div style="scroll-snap-align: center; min-width: 160px; flex: 0 0 auto; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:20px; display:flex; flex-direction:column; backdrop-filter:blur(20px);">
              <div style="font-size:1rem; font-weight:800; color:#38bdf8; margin-bottom:8px;">${escapeHtml(dayKey)}</div>
              <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:8px;">${moon}</div>
              
              <div style="background:${statusColor}22; border:1px solid ${statusColor}44; border-radius:12px; padding:6px 12px; display:inline-block; margin-bottom:16px; align-self:flex-start;">
                  <span style="font-size:0.78rem; font-weight:800; color:${statusColor};">${escapeHtml(statusText)}</span>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:12px;">
                  <div>
                      <div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Temp</div>
                      <div style="color:white; font-size:1.1rem; font-weight:600;">${Math.round(maxTemp)}° <span style="color:#64748b; font-size:0.9rem;">${Math.round(minTemp)}°</span></div>
                  </div>
                  <div>
                      <div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Rain</div>
                      <div style="color:#bae6fd; font-size:1.1rem; font-weight:600;">${totalPrecip.toFixed(2)}"</div>
                  </div>
                  <div>
                      <div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Chance</div>
                      <div style="color:#93c5fd; font-size:1.1rem; font-weight:600;">${precipProb}%</div>
                  </div>
                  <div>
                      <div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Gusts</div>
                      <div style="color:#e2e8f0; font-size:1.1rem; font-weight:600;">${Math.round(maxWind)} mph</div>
                  </div>
                  ${rainHoursHtml ? `<div>${rainHoursHtml}</div>` : ''}
              </div>
          </div>`;
        }).join('');
      }
    }

    // Share forecast card report deep-link and text template
    async function shareForecast() {
      if (!globalWxData) return;
      const el = id => document.getElementById(id);
      const verdict = el('lake-verdict-label').textContent;
      const sub = el('lake-verdict-sub').textContent;
      const feels = el('lake-feels').textContent;
      const wind = el('lake-wind').textContent;
      const windDir = el('lake-wind-dir').textContent;
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?view=telemetry&mode=${currentMode}`;
      const text = `🌊 WaZWeather Report (${currentMode.toUpperCase()} mode):
Verdict: ${verdict} - ${sub}
Feels: ${feels} | Wind: ${wind} ${windDir}
Check live hydrology & weather flow: ${shareUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'WaZWeather Live Report',
            text: text,
            url: shareUrl
          });
        } catch (err) {
          console.warn('Navigator share cancelled/failed:', err);
        }
      } else {
        try {
          await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
          alert('WaZWeather forecast report copied to clipboard! Share it with your friends.');
        } catch (err) {
          console.error('Clipboard copy failed:', err);
          alert('Could not copy forecast. Copy link manually: ' + shareUrl);
        }
      }
    }

    // Render NWS Alerts card
    async function renderAlertsCard() {
      const severityColor = { Extreme:'#ef4444', Severe:'#f97316', Moderate:'#eab308', Minor:'#9ca3af' };
      try {
        const { features, ts } = await fetchNWSAlerts();
        const card = document.getElementById('nws-alerts-card');
        const list = document.getElementById('nws-alerts-list');
        const stamp = document.getElementById('nws-alerts-stamp');

        if (!features || features.length === 0) {
          card.style.display = 'none';
          if (navigator.clearAppBadge) navigator.clearAppBadge();
          return;
        }

        card.style.display = 'flex';
        stamp.textContent = relativeTime(ts);

        // PWA OS badge
        const severeCount = features.filter(f => ['Extreme','Severe'].includes(f.properties.severity)).length;
        if (navigator.setAppBadge && severeCount > 0) navigator.setAppBadge(severeCount);

        list.innerHTML = features.slice(0, 3).map(f => {
          const p = f.properties;
          const color = severityColor[p.severity] || '#9ca3af';
          const expires = p.expires ? new Date(p.expires) : null;
          const expiresStr = expires ? `Expires ${expires.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}` : '';
          return `
            <div style="background:rgba(255,255,255,0.02); border:1px solid ${color}33; border-left:3px solid ${color}; border-radius:12px; padding:16px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <span style="background:${color}22; color:${color}; font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:3px 10px; border-radius:100px; border:1px solid ${color}44;">${escapeHtml(p.severity)} · ${escapeHtml(p.urgency)}</span>
                <span style="color:#9ca3af; font-size:0.7rem;">${escapeHtml(expiresStr)}</span>
              </div>
              <div style="color:white; font-weight:700; font-size:1rem; line-height:1.3; margin-bottom:4px;">${escapeHtml(p.event)}</div>
              <div style="color:#9ca3af; font-size:0.8rem; line-height:1.4;">${escapeHtml((p.headline || '').substring(0, 120))}</div>
            </div>`;
        }).join('');
      } catch(err) {
        console.warn('NWS alerts render error:', err);
        document.getElementById('nws-alerts-card').style.display = 'none';
      }
    }

    // Render 24-hr precip timeline bars
    function renderHourlyPrecip(wxData) {
      try {
        const h = wxData.hourly;
        if (!h || !h.precipitation) return;
        const now = new Date();
        let curHr = 0;
        for (let i = 0; i < h.time.length; i++) {
          if (new Date(h.time[i]) <= now) curHr = i;
          else break;
        }
        // FIX 7: guard against truncation near end of 7-day window
        const precips = h.precipitation.slice(curHr, Math.min(curHr + 24, h.time.length));
        const times   = h.time.slice(curHr, Math.min(curHr + 24, h.time.length));
        const maxP    = Math.max(...precips, 0.01);
        const total   = precips.reduce((a, b) => a + b, 0);

        const barsEl   = document.getElementById('hourly-precip-bars');
        const labelsEl = document.getElementById('hourly-precip-labels');
        const totalEl  = document.getElementById('hourly-total');

        if (!barsEl) return;
        totalEl.textContent = total.toFixed(2) + '"';

        barsEl.innerHTML = precips.map((val, i) => {
          const pct  = Math.max(4, Math.round((val / maxP) * 100));
          const hr   = new Date(times[i]).getHours();
          const isNow = i === 0;
          const color = val > 0 ? '#38bdf8' : 'rgba(255,255,255,0.08)';
          return `<div title="${hr}:00 — ${val.toFixed(3)}\"" style="flex:1; height:${pct}%; background:${color}; border-radius:3px 3px 0 0; min-height:4px; position:relative; ${isNow ? 'box-shadow:0 0 6px #38bdf8;' : ''}">${isNow ? '<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#39ff14;border-radius:50%;"></div>' : ''}</div>`;
        }).join('');

        // Show labels at 0h, 6h, 12h, 18h, 24h
        const labelTimes = [0, 6, 12, 18, 23];
        labelsEl.innerHTML = labelTimes.map(offset => {
          if (offset >= times.length) return '';
          const hr = new Date(times[offset]).getHours();
          const label = hr === 0 ? 'Midnight' : hr < 12 ? hr + 'am' : hr === 12 ? 'Noon' : (hr - 12) + 'pm';
          return `<span style="color:#9ca3af; font-size:0.65rem; font-weight:600;">${label}</span>`;
        }).join('');
      } catch(err) {
        console.warn('Hourly precip render error:', err);
      }
    }

    // Render river stage + trend on hydrology card
    async function renderRiverStage(gaugeFt) {
      // Flood stages for WRRW3 (Wisconsin River at Wisconsin Rapids) — NWS AHPS hardcoded thresholds
      const FLOOD_STAGES = { action: 8, flood: 12, major: 20 };
      const bar = document.getElementById('flood-stage-bar');
      const fill = document.getElementById('flood-stage-fill');
      const label = document.getElementById('flood-stage-label');
      const forecast = document.getElementById('river-stage-forecast');
      if (!bar || gaugeFt === null || isNaN(gaugeFt)) return;

      bar.style.display = 'block';
      const pct = Math.min(100, Math.round((gaugeFt / FLOOD_STAGES.major) * 100));
      let stageColor = '#39ff14'; // normal
      let stageText = `${gaugeFt.toFixed(2)} ft — Normal`;
      if (gaugeFt >= FLOOD_STAGES.major) { stageColor = '#ef4444'; stageText = `${gaugeFt.toFixed(2)} ft — Major Flood`; }
      else if (gaugeFt >= FLOOD_STAGES.flood) { stageColor = '#f97316'; stageText = `${gaugeFt.toFixed(2)} ft — Flood Stage`; }
      else if (gaugeFt >= FLOOD_STAGES.action) { stageColor = '#eab308'; stageText = `${gaugeFt.toFixed(2)} ft — Action Stage`; }

      fill.style.width = pct + '%';
      fill.style.background = stageColor;
      label.textContent = stageText;

      // AHPS 24h predicted stage
      try {
        const ahps = await fetchRiverStage();
        if (ahps && ahps.data && ahps.data.length > 0) {
          const future = ahps.data.find(d => {
            const t = new Date(d.validTime);
            return t > new Date() && t <= new Date(Date.now() + 25*3600*1000);
          });
          if (future) {
            forecast.textContent = `NWS forecast: ${parseFloat(future.primary).toFixed(2)} ft in ~24h`;
          }
        }
      } catch(e) { /* AHPS optional */ }
    }

    /* Live Telemetry Data Fetch */
    const CACHE_DURATION      = 15 * 60 * 1000;          // 15 min — USGS (updates every 15 min)
    const CACHE_DURATION_SLOW = 4  * 60 * 60 * 1000;    // 4 hr  — AQI + weather forecast
    async function fetchTelemetry() {
      // 1. Fetch USGS Hydrology (Flow, Gauge, Current Speed for 7 Days)
      try {
        const CACHE_KEY = 'usgs_hydro_cache_v2';
        const now = Date.now();
        const cached = localStorage.getItem(CACHE_KEY);
        let hydroData;
        
        if (cached) {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp < CACHE_DURATION) {
            hydroData = parsed.data;
            console.log("Loaded USGS data from 15-min browser cache.");
          }
        }
        
        if (!hydroData) {
          const hydroRes = await fetch('https://waterservices.usgs.gov/nwis/iv/?format=json&sites=05400760&parameterCd=00060,00065,72254&period=P7D');
          hydroData = await hydroRes.json();
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, data: hydroData }));
          console.log("Fetched fresh USGS data and updated cache.");
        }
        
        let cfsData=[], gaugeData=[], labels=[];
        hydroData.value.timeSeries.forEach(series => {
          const code = series.variable.variableCode[0].value;
          const valuesList = series.values[0].value;
          if (!valuesList || valuesList.length === 0) return;
          
          const currentVal = valuesList[valuesList.length - 1].value;
          
          if (code === '00060') {
            const cfsCurrent = parseFloat(currentVal);
            const cfsPrev    = valuesList.length > 2 ? parseFloat(valuesList[valuesList.length - 2].value) : cfsCurrent;
            document.getElementById('metric-cfs').textContent = `${cfsCurrent.toLocaleString()} CFS`;
            if(document.getElementById('telemetry-flow')) document.getElementById('telemetry-flow').textContent = `${cfsCurrent.toLocaleString()} CFS`;
            // Trend arrow
            const trendEl = document.getElementById('metric-trend');
            if (trendEl) {
              const delta = cfsCurrent - cfsPrev;
              trendEl.textContent = delta > 50 ? '↑ Rising' : delta < -50 ? '↓ Falling' : '→ Steady';
              trendEl.style.color  = delta > 50 ? '#ef4444' : delta < -50 ? '#34d399' : '#9ca3af';
            }
            const step = Math.max(1, Math.floor(valuesList.length / 40));
            for(let i=0; i<valuesList.length; i+=step) {
              cfsData.push(parseFloat(valuesList[i].value));
              const d = new Date(valuesList[i].dateTime);
              labels.push(d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }));
            }
          } else if (code === '00065') {
            const gaugeFt = parseFloat(currentVal);
            document.getElementById('metric-gauge').textContent = `${gaugeFt.toFixed(2)} ft`;
            const step = Math.max(1, Math.floor(valuesList.length / 40));
            for(let i=0; i<valuesList.length; i+=step) gaugeData.push(parseFloat(valuesList[i].value));
            // Trigger flood stage bar (async, non-blocking)
            renderRiverStage(gaugeFt);
          } else if (code === '72254') {
            document.getElementById('metric-vel').textContent = `${parseFloat(currentVal).toFixed(2)} ft/s`;
          }
        });

        // Hydrology Chart
        if (window.hydroChartInst) window.hydroChartInst.destroy();
        window.hydroChartInst = new Chart(document.getElementById('hydroChart').getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              { label: 'Flow (CFS)', data: cfsData, borderColor: '#39ff14', backgroundColor: 'rgba(57, 255, 20, 0.1)', yAxisID: 'y', fill: true, tension: 0.6, pointRadius: 0 },
              { label: 'Gauge (ft)', data: gaugeData, borderColor: '#ffffff', yAxisID: 'y1', borderDash: [5, 5], tension: 0.6, pointRadius: 0 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#9ca3af', maxTicksLimit: 7 } },
              y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#00e5ff' } },
              y1: { type: 'linear', display: true, position: 'right', grid: { display: false }, ticks: { color: '#a78bfa' } }
            },
            plugins: { legend: { labels: { color: '#9CA3AF' } } }
          }
        });
      } catch (err) {
        console.error("USGS Fetch error (using fallback):", err);
        // Fallback
        document.getElementById('metric-cfs').textContent = `15,700 CFS`;
        if(document.getElementById('telemetry-flow')) document.getElementById('telemetry-flow').textContent = `15,700 CFS`;
        document.getElementById('metric-gauge').textContent = `10.42 ft`;
        document.getElementById('metric-vel').textContent = `1.48 ft/s`;

        const labels = [];
        const cfsData = [];
        const gaugeData = [];
        const baseDate = new Date();
        for (let i = 0; i < 40; i++) {
          const d = new Date(baseDate.getTime() - (40 - i) * 60 * 60 * 1000);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }));
          cfsData.push(14500 + Math.random() * 2000);
          gaugeData.push(9.8 + Math.random() * 1.2);
        }
        if (window.hydroChartInst) window.hydroChartInst.destroy();
        window.hydroChartInst = new Chart(document.getElementById('hydroChart').getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              { label: 'Flow (CFS)', data: cfsData, borderColor: '#39ff14', backgroundColor: 'rgba(57, 255, 20, 0.1)', yAxisID: 'y', fill: true, tension: 0.6, pointRadius: 0 },
              { label: 'Gauge (ft)', data: gaugeData, borderColor: '#ffffff', yAxisID: 'y1', borderDash: [5, 5], tension: 0.6, pointRadius: 0 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#9ca3af', maxTicksLimit: 7 } },
              y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#00e5ff' } },
              y1: { type: 'linear', display: true, position: 'right', grid: { display: false }, ticks: { color: '#a78bfa' } }
            },
            plugins: { legend: { labels: { color: '#9CA3AF' } } }
          }
        });
      }

      // 2. Fetch Open-Meteo AQI
      try {
        const CACHE_KEY = 'aqi_cache_v3';
        const now = Date.now();
        const cached = localStorage.getItem(CACHE_KEY);
        let aqiData;
        
        if (cached) {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp < CACHE_DURATION_SLOW) {
            aqiData = parsed.data;
            console.log("Loaded AQI data from 4-hour browser cache.");
          }
        }
        
        if (!aqiData) {
          const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=44.3936&longitude=-89.8173&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index');
          aqiData = await aqiRes.json();
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, data: aqiData }));
          console.log("Fetched fresh AQI data and updated cache.");
        }
        const c = aqiData.current;
        
        document.getElementById('metric-aqi').textContent = c.us_aqi || 20;
        if(document.getElementById('telemetry-aqi')) document.getElementById('telemetry-aqi').textContent = c.us_aqi || 20;
        document.getElementById('metric-dust').textContent = `${c.dust || 0} μg/m³`;
        document.getElementById('metric-uv').textContent = c.uv_index || 0;
        
        let status = 'Excellent', statusColor = 'var(--accent-tap)';
        if (c.us_aqi > 50) { status = 'Moderate'; statusColor = 'var(--accent-pour)'; }
        if (c.us_aqi > 100) { status = 'Unhealthy'; statusColor = '#EF4444'; }
        
        const statusEl = document.getElementById('detail-aqi-status');
        statusEl.textContent = `Status: ${status}`; statusEl.style.color = statusColor;
        document.getElementById('metric-aqi').style.color = statusColor;

        const barsContainer = document.getElementById('pollutant-bars');
        if (barsContainer) {
          const pollutants = [
            { label: 'Ozone (O₃)', value: c.ozone || 0, max: 120, unit: 'μg/m³', color: '#00e5ff' },
            { label: 'PM10 (Dust)', value: c.pm10 || 0, max: 100, unit: 'μg/m³', color: '#ff6b35' },
            { label: 'PM2.5 (Fine Dust)', value: c.pm2_5 || 0, max: 50, unit: 'μg/m³', color: '#00ff88' },
            { label: 'Carbon Monoxide (CO)', value: c.carbon_monoxide || 0, max: 1000, unit: 'μg/m³', color: '#bf5fff' },
            { label: 'Nitrogen Dioxide (NO₂)', value: c.nitrogen_dioxide || 0, max: 200, unit: 'μg/m³', color: '#ffcc00' }
          ];

          barsContainer.innerHTML = pollutants.map(p => {
            const pct = Math.min(100, (p.value / p.max) * 100);
            return `
              <div class="pollutant-bar-row">
                <div class="pollutant-bar-label">
                  <span>${escapeHtml(p.label)}</span>
                  <span>${escapeHtml(p.value)} ${escapeHtml(p.unit)}</span>
                </div>
                <div class="pollutant-bar-bg">
                  <div class="pollutant-bar-fill" style="width: ${pct}%; background: ${escapeHtml(p.color)};"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err) {
        console.error("AQI Fetch Error (using fallback):", err);
        document.getElementById('metric-aqi').textContent = '26';
        if(document.getElementById('telemetry-aqi')) document.getElementById('telemetry-aqi').textContent = '26';
        document.getElementById('metric-dust').textContent = '1 μg/m³';
        document.getElementById('metric-uv').textContent = '3.65';
        document.getElementById('detail-aqi-status').textContent = 'Status: Excellent';
        document.getElementById('detail-aqi-status').style.color = 'var(--accent-tap)';
        
        const barsContainer = document.getElementById('pollutant-bars');
        if (barsContainer) {
          barsContainer.innerHTML = `
            <div class="pollutant-bar-row">
              <div class="pollutant-bar-label"><span>Ozone (O₃)</span><span>76.0 μg/m³</span></div>
              <div class="pollutant-bar-bg"><div class="pollutant-bar-fill" style="width: 63%; background: #00e5ff;"></div></div>
            </div>
            <div class="pollutant-bar-row">
              <div class="pollutant-bar-label"><span>PM10 (Dust)</span><span>4.0 μg/m³</span></div>
              <div class="pollutant-bar-bg"><div class="pollutant-bar-fill" style="width: 4%; background: #ff6b35;"></div></div>
            </div>
            <div class="pollutant-bar-row">
              <div class="pollutant-bar-label"><span>PM2.5 (Fine Dust)</span><span>3.4 μg/m³</span></div>
              <div class="pollutant-bar-bg"><div class="pollutant-bar-fill" style="width: 7%; background: #00ff88;"></div></div>
            </div>
            <div class="pollutant-bar-row">
              <div class="pollutant-bar-label"><span>Carbon Monoxide (CO)</span><span>110.0 μg/m³</span></div>
              <div class="pollutant-bar-bg"><div class="pollutant-bar-fill" style="width: 11%; background: #bf5fff;"></div></div>
            </div>
            <div class="pollutant-bar-row">
              <div class="pollutant-bar-label"><span>Nitrogen Dioxide (NO₂)</span><span>1.6 μg/m³</span></div>
              <div class="pollutant-bar-bg"><div class="pollutant-bar-fill" style="width: 1%; background: #ffcc00;"></div></div>
            </div>
          `;
        }
      }

      // 3. Fetch Open-Meteo Weather Forecast
      try {
        const CACHE_KEY = 'weather_cache_v5';
        const now = Date.now();
        const cached = localStorage.getItem(CACHE_KEY);
        let wxData;
        
        if (cached) {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp < CACHE_DURATION_SLOW) {
            wxData = parsed.data;
            console.log("Loaded Weather data from 4-hour browser cache.");
          }
        }
        
        if (!wxData) {
          // FIX 2: added precipitation_sum to daily params so real daily totals are available
          const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${WAZ_LAT}&longitude=${WAZ_LON}&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,precipitation_probability,weather_code,uv_index&daily=sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max,wind_gusts_10m_max,weather_code,precipitation_sum&forecast_days=7&timezone=America%2FChicago&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`);
          wxData = await wxRes.json();
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, data: wxData }));
          console.log("Fetched fresh Weather data and updated cache.");
        }

        // Wire up new render functions with the fresh wx data
        renderLakeCard(wxData);
        renderForecastTrack(wxData);
        renderHourlyPrecip(wxData);
        renderAlertsCard();

      } catch(err) {
        console.error("Weather Fetch Error (using fallback):", err);
        const plannerContainer = document.getElementById('weather-planner');
        if (plannerContainer) {
          plannerContainer.innerHTML = `
            <div class="weather-day-card">
              <div class="weather-day-title">
                <span>Wednesday, Jun 17</span>
                <span class="weather-day-status status-warn">Caution: Light Rain</span>
              </div>
              <div class="weather-metrics-list">
                <div class="weather-metric-item"><span>Temp Range</span><span>62°F - 78°F</span></div>
                <div class="weather-metric-item"><span>Total Rain</span><span>0.12 in</span></div>
                <div class="weather-metric-item"><span>Max Wind Gusts</span><span>14 mph</span></div>
                <div class="weather-metric-item" style="flex-direction: column; gap: 4px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 6px;">
                  <span style="font-size: 0.75rem; color: var(--text-dim);">Rain Outlook</span>
                  <span style="color: var(--accent-info); font-size: 0.8rem; font-weight: normal; text-align: left;">Rain risk at: 2:00 PM, 3:00 PM</span>
                </div>
              </div>
            </div>
            <div class="weather-day-card">
              <div class="weather-day-title">
                <span>Thursday, Jun 18</span>
                <span class="weather-day-status status-ok">Good to Go</span>
              </div>
              <div class="weather-metrics-list">
                <div class="weather-metric-item"><span>Temp Range</span><span>58°F - 82°F</span></div>
                <div class="weather-metric-item"><span>Total Rain</span><span>0.00 in</span></div>
                <div class="weather-metric-item"><span>Max Wind Gusts</span><span>10 mph</span></div>
                <div class="weather-metric-item" style="flex-direction: column; gap: 4px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 6px;">
                  <span style="font-size: 0.75rem; color: var(--text-dim);">Rain Outlook</span>
                  <span style="color: var(--accent-info); font-size: 0.8rem; font-weight: normal; text-align: left;">No Rain Expected</span>
                </div>
              </div>
            </div>
            <div class="weather-day-card">
              <div class="weather-day-title">
                <span>Friday, Jun 19</span>
                <span class="weather-day-status status-stop">No Work: Heavy Rain</span>
              </div>
              <div class="weather-metrics-list">
                <div class="weather-metric-item"><span>Temp Range</span><span>60°F - 72°F</span></div>
                <div class="weather-metric-item"><span>Total Rain</span><span>0.85 in</span></div>
                <div class="weather-metric-item"><span>Max Wind Gusts</span><span>22 mph</span></div>
                <div class="weather-metric-item" style="flex-direction: column; gap: 4px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 6px;">
                  <span style="font-size: 0.75rem; color: var(--text-dim);">Rain Outlook</span>
                  <span style="color: var(--accent-info); font-size: 0.8rem; font-weight: normal; text-align: left;">Steady Rain throughout day</span>
                </div>
              </div>
            </div>
          `;
        }
      }
    }

    function openDialog(key) {
      const info = APP_DATA[key];
      if (!info) return;

      titleEl.textContent = info.title;
      titleEl.style.color = info.accent;

      if (key === 'dashboard') {
        screenshotContainer.style.display = 'none';
        standardView.style.display = 'none';
        telemetryView.style.display = 'block';
        launchBtn.textContent = 'Close HUD';
        launchBtn.style.backgroundColor = 'var(--accent-info)';
      } else {
        if (info.screenshot) {
          screenshotEl.src = info.screenshot;
          screenshotContainer.style.display = 'flex';
        } else {
          screenshotContainer.style.display = 'none';
        }
        
        standardView.style.display = 'block';
        telemetryView.style.display = 'none';
        descEl.textContent = info.desc;
        audienceEl.innerHTML = info.who.map(w => `<span class="tag">${w}</span>`).join('');
        launchBtn.textContent = info.btnLabel;
        launchBtn.style.backgroundColor = info.accent;
      }

      launchBtn.href = info.link;
      launchBtn.dataset.appKey = key;
      overlay.classList.add('open');
    }

    function closeDialog() {
      overlay.classList.remove('open');
      // Reset animations safely
      const fillPm10 = document.getElementById('fill-pm10');
      if (fillPm10) fillPm10.style.width = '0%';
      const fillPm25 = document.getElementById('fill-pm25');
      if (fillPm25) fillPm25.style.width = '0%';
      const fillUv = document.getElementById('fill-uv');
      if (fillUv) fillUv.style.width = '0%';
    }

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const appKey = card.dataset.app;
        if(appKey === 'sentinel') return;
        openDialog(appKey);
      });
    });

    const closeBtn = document.getElementById('dialog-close');
    if(closeBtn) closeBtn.addEventListener('click', closeDialog);
    
    // Telemetry tracking on launch
    const trackBtn = document.getElementById('dialog-launch-btn');
    if(trackBtn) {
      trackBtn.addEventListener('click', () => {
        const appKey = trackBtn.dataset.appKey;
        if (appKey && appKey !== 'dashboard' && appKey !== '#') {
          fetch('/telemetry?app=' + encodeURIComponent(appKey) + '&track=1', { method: 'POST', keepalive: true }).catch(e => console.error(e));
        }
      });
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });
    
    // Init Page Details
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    fetchTelemetry();

    // Smooth scroll navigation to specific WaZWeather snap cards
    function scrollToWazCard(targetId) {
      const targetCard = document.getElementById(targetId);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Scroll snap handler removed

    // Init Live Clock
    setInterval(() => {
      const clockEl = document.getElementById('live-clock');
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
      }
    }, 1000);
    // --- GATEWAY PORTAL MANAGEMENT ---
    let activePortalId = 'split';
    
    function revealPath(path) {
      const wrap = document.getElementById('split-wrapper');
      if (path === 'database') {
        wrap.className = 'theme-split split-triggered-left';
      } else {
        wrap.className = 'theme-split split-triggered-right';
      }
      
      // Show/Hide Dots HUD accordingly
      const dotsHud = document.getElementById('waz-nav-hud');
      if (dotsHud) {
        dotsHud.style.display = path === 'telemetry' ? 'flex' : 'none';
      }

      // Fade in the transition view after a short delay
      setTimeout(() => {
        const portal = document.getElementById('portal-split');
        portal.classList.add('hidden-gateway');
        
        const viewId = path === 'database' ? 'pwa-catalog' : 'wazeecha-telemetry';
        document.getElementById(viewId).classList.add('active');
        
        // Ensure scroll brings the new section into view
        document.getElementById(viewId).scrollIntoView({ behavior: 'smooth' });
      }, 600);
      
      playMechanicalClick();
    }
    
    function resetActiveGateway() {
      // Hide content views
      document.querySelectorAll('.content-section').forEach(v => v.classList.remove('active'));
      
      // Hide Dots HUD
      const dotsHud = document.getElementById('waz-nav-hud');
      if (dotsHud) dotsHud.style.display = 'none';

      // Reset gateway
      const portal = document.getElementById('portal-split');
      portal.classList.remove('hidden-gateway');
      
      const wrap = document.getElementById('split-wrapper');
      if (wrap) wrap.className = 'theme-split';
    }
    
    function playMechanicalClick() {
      // Audio removed per user request
    }

    // Auto collapse removed
    }
    function resetHudCollapseTimeout() {
        if (document.getElementById('waz-nav-hud').classList.contains('collapsed')) return;
        clearTimeout(hudCollapseTimeout);
        hudCollapseTimeout = setTimeout(() => {
            collapseHud();
        }, 4000);
    }
    
    // Monitor interaction to reset HUD timeout
    const wazContainer = document.getElementById('wazeecha-telemetry');
    if (wazContainer) {
        wazContainer.addEventListener('scroll', () => {
            syncHudDots();
            resetHudCollapseTimeout();
        }, { passive: true });
    }
    
    document.addEventListener('touchstart', resetHudCollapseTimeout, { passive: true });
    document.addEventListener('mousemove', resetHudCollapseTimeout, { passive: true });
    resetHudCollapseTimeout();
  
    const mainContainer = document.querySelector('main');
    const scrollTrack = document.querySelector('.dashboard-grid');
    const walkBg = document.getElementById('walkthrough-bg');

    window.addEventListener('wheel', (e) => {
      const portal = document.getElementById('portal-split');
      const telemetry = document.getElementById('wazeecha-telemetry');
      if (portal.classList.contains('hidden-gateway') && telemetry.classList.contains('active')) {
          e.preventDefault();
          scrollTrack.scrollLeft += e.deltaY;
          if (walkBg) {
              walkBg.style.transform = `translateX(${-scrollTrack.scrollLeft * 0.2}px)`;
          }
      }
    }, { passive: false });

    // --- WAZEECHA WEATHER PUSH NOTIFICATION SYSTEM ---
    const BACKEND_URL = ""; // Empty string forces relative paths natively
    const vapidPublicKey = "BMb36GOhjyJJzODjpDxXhmv7PZxyR-e2miXbuOakZESk83z-TgtgobvOXYIWGkgaDTREY9A5XcaXDTBfWQToHOM";
    let swReg = null;
    let isSubscribed = false;

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    async function initWeatherPush() {
      const btn = document.getElementById('btn-weather-push');
      const status = document.getElementById('weather-push-status');
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Notifications Unsupported";
          btn.style.borderColor = "var(--accent-pour)";
        }
        if (status) {
          status.innerHTML = "💡 iOS setup: Add to Home Screen (Share -> Add to Home Screen) and open as standalone PWA.";
        }
        return;
      }

      try {
        swReg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
        const subscription = await swReg.pushManager.getSubscription();
        isSubscribed = !!subscription;
        updateWeatherPushUI(subscription);
      } catch (err) {
        console.error("Failed to init weather push SW:", err);
        if (btn) btn.textContent = "Error Loading Service Worker";
      }
    }

    function updateWeatherPushUI(subscription) {
      const btn = document.getElementById('btn-weather-push');
      const status = document.getElementById('weather-push-status');
      
      if (!btn) return;

      if (subscription) {
        isSubscribed = true;
        btn.textContent = "Disable Alerts";
        btn.style.background = "var(--accent-info)";
        btn.style.color = "var(--bg-obsidian)";
        if (status) {
          status.innerHTML = `<span style="color: var(--accent-tap); font-size:1rem;">✓ Alerts armed for Lake Wazeecha.</span><br><span style="font-size:0.75rem; color:#888;">Notifications active · Powered by Cloudflare Edge</span>`;
        }
      } else {
        isSubscribed = false;
        btn.textContent = "Enable Weather Alerts";
        btn.style.background = "transparent";
        btn.style.color = "var(--text-white)";
        if (status) status.textContent = "Not subscribed";
      }
    }


    async function toggleWeatherPush() {
      const btn = document.getElementById('btn-weather-push');
      const status = document.getElementById('weather-push-status');
      if (!swReg) return;

      if (isSubscribed) {
        const subscription = await swReg.pushManager.getSubscription();
        if (subscription) {
          if (status) status.textContent = "Unsubscribing from server...";
          try {
            await fetch(`${BACKEND_URL}/unsubscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription)
            });
          } catch (e) {
            console.warn("Failed to notify backend of unsubscription:", e);
          }
          await subscription.unsubscribe();
          updateWeatherPushUI(null);
        }
      } else {
        if (btn) btn.textContent = "Requesting permission...";
        
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            if (status) status.textContent = "Permission denied.";
            if (btn) btn.textContent = "Enable Weather Alerts";
            return;
          }

          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
          const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
          });
          
          if (status) status.textContent = "Registering with alert server...";
          try {
            const subJson = subscription.toJSON();
            const payload = {
              ...subJson,
              preferences: {
                river: document.getElementById('pref-river-alerts').checked,
                aqi: document.getElementById('pref-aqi-alerts').checked,
                weather: document.getElementById('pref-weather-alerts').checked
              }
            };
            const res = await fetch(`${BACKEND_URL}/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Server rejected subscription: ${res.status} ${text}`);
            }
          } catch (e) {
            console.warn("Failed to register subscription with backend:", e);
            throw e; // re-throw so we catch it below and reset UI
          }

          updateWeatherPushUI(subscription);
        } catch (err) {
          console.error("Subscription failed:", err);
          if (status) status.textContent = "Subscription failed: " + err.message;
          if (btn) btn.textContent = "Enable Weather Alerts";
        }
      }
    }

    function checkDeepLink() {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      const queryMode = urlParams.get('mode');
      if (queryMode && ['fishing', 'lake', 'construction', 'family'].includes(queryMode)) {
        currentMode = queryMode;
        localStorage.setItem('waz_weather_mode', queryMode);
      }

      if (urlParams.get('view') === 'telemetry' || hash === '#wazeecha-telemetry') {
        revealPath('telemetry');
      }

      // Sync selector active button highlights
      document.querySelectorAll('.persona-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.getElementById('btn-mode-' + currentMode);
      if (activeBtn) activeBtn.classList.add('active');
    }

    // Initialize check on load
    window.addEventListener('DOMContentLoaded', () => {
      initWeatherPush();
      checkDeepLink();

      // BUG-05: Auto-hide scroll indicator when last card is visible
      const scrollBtn = document.getElementById('scroll-indicator');
      const swipeCards = document.querySelectorAll('#wazeecha-telemetry .swipe-card');
      const lastCard = swipeCards[swipeCards.length - 1];
      if (scrollBtn && lastCard) {
        new IntersectionObserver(entries => {
          scrollBtn.style.display = entries[0].isIntersecting ? 'none' : 'flex';
        }, { threshold: 0.5 }).observe(lastCard);
      }
    });
    window.addEventListener('hashchange', checkDeepLink);
  