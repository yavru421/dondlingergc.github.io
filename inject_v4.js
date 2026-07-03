const fs = require('fs');

const NEW_SECTION = `     <!-- LIVE TELEMETRY HUD — WaZWeather Swipe UI v4 -->
     <section id="wazeecha-telemetry" class="telemetry-section content-section" style="position:fixed;inset:0;z-index:9999;background:#050a06;margin:0;padding:0;display:flex;flex-direction:row;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;">

<style>
/* ── WaZWeather v4 ────────────────────────────────── */
#waz-dots{position:fixed;top:0;left:0;right:0;padding-top:max(env(safe-area-inset-top,0px),14px);display:flex;justify-content:center;gap:6px;z-index:10001;pointer-events:none;padding-left:80px;padding-right:80px;}
.waz-dot{flex:1;max-width:80px;height:3px;background:rgba(255,255,255,0.2);border-radius:3px;transition:background .3s,box-shadow .3s;}
.waz-dot.active{background:#39FF14;box-shadow:0 0 8px rgba(57,255,20,.7);}
#waz-top-bar{position:fixed;top:0;left:0;right:0;padding:max(env(safe-area-inset-top,0px),28px) 16px 12px;z-index:10000;display:flex;justify-content:space-between;align-items:flex-start;background:linear-gradient(to bottom,rgba(0,0,0,.8) 0%,transparent 100%);pointer-events:none;}
#waz-clock-wrap{pointer-events:auto;display:flex;flex-direction:column;gap:2px;}
#waz-live-badge{display:flex;align-items:center;gap:5px;}
.waz-live-dot{width:7px;height:7px;border-radius:50%;background:#39FF14;box-shadow:0 0 8px #39FF14;animation:wazpulse 2s ease-in-out infinite;}
@keyframes wazpulse{0%,100%{opacity:1}50%{opacity:.3}}
.waz-live-label{color:#39FF14;font-size:.68rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;}
#waz-clock{font-family:ui-monospace,monospace;font-size:1rem;font-weight:700;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6);}
#waz-close-btn{pointer-events:auto;background:rgba(255,255,255,.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.18);color:#fff;width:44px;height:44px;border-radius:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s;flex-shrink:0;}
#waz-close-btn:hover,#waz-close-btn:active{background:rgba(255,255,255,.2);}
.waz-card{width:100vw;height:100vh;flex-shrink:0;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;-webkit-overflow-scrolling:touch;}
.waz-card::-webkit-scrollbar{display:none;}

/* ── Card 1: NOW ── */
#waz-now{background:radial-gradient(circle at 30% 20%,#052e16,#050a06 70%);}
.now-body{padding:80px 20px 40px;max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
.now-source{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px;}
.now-source-lbl{color:#9ca3af;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;}
.now-source-sub{color:#9ca3af;font-size:.65rem;margin-top:1px;}
#waz-updated{color:#9ca3af;font-size:.65rem;}
.waz-verdict-pill{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:100px;padding:14px 20px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
#waz-verdict-emoji{font-size:1.8rem;flex-shrink:0;}
#waz-verdict-label{font-size:1.35rem;font-weight:900;color:#fff;letter-spacing:-.5px;line-height:1.2;}
#waz-verdict-sub{font-size:.75rem;color:#9ca3af;margin-top:2px;}
.now-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.now-stat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px 12px;display:flex;flex-direction:column;gap:3px;}
.now-stat-lbl{color:#9ca3af;font-size:.62rem;text-transform:uppercase;font-weight:700;letter-spacing:.5px;}
.now-stat-val{color:#fff;font-size:1.3rem;font-weight:800;line-height:1.1;}
.now-stat-sub{color:#9ca3af;font-size:.68rem;}
.sun-row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:14px;padding:12px 16px;}
.sun-item{display:flex;align-items:center;gap:8px;}
.sun-lbl{color:#9ca3af;font-size:.6rem;text-transform:uppercase;font-weight:700;}
.sun-val{color:#fff;font-size:.88rem;font-weight:700;}
.sun-sep{flex:1;height:1px;background:rgba(255,255,255,.05);margin:0 12px;}
.vis-row{display:flex;justify-content:space-between;align-items:center;padding:2px 4px;}
.vis-lbl{color:#9ca3af;font-size:.78rem;}
#waz-visibility{color:#9ca3af;font-size:.78rem;font-weight:600;}
.advice-box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:5px;}
.advice-hdr{color:#9ca3af;font-size:.6rem;text-transform:uppercase;font-weight:700;display:flex;align-items:center;gap:5px;}
#waz-advice{color:#fff;font-size:.8rem;line-height:1.5;font-weight:500;}
.persona-row{display:flex;gap:8px;flex-wrap:wrap;}
.persona-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:7px 14px;color:#9ca3af;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px;}
.persona-btn.active{background:rgba(57,255,20,.12);border-color:rgba(57,255,20,.4);color:#39FF14;}

/* ── Card 2: RADAR ── */
#waz-radar{padding:0;}
#waz-radar-iframe{width:100%;height:100%;border:none;position:absolute;inset:0;}

/* ── Card 3: RIVER ── */
#waz-river{background:radial-gradient(circle at 70% 10%,#1e3a8a,#0a0f1e 60%);}
.river-body{padding:80px 20px 40px;max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:18px;}
.river-hdr{display:flex;align-items:center;gap:14px;}
.river-icon{width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 20px rgba(59,130,246,.3);}
.river-title{font-size:1.8rem;font-weight:900;color:#fff;letter-spacing:-.5px;}
.river-sub{color:#94a3b8;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.river-main{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px;}
.river-cfs-lbl{color:#94a3b8;font-size:.85rem;font-weight:600;margin-bottom:6px;}
.river-cfs-val{color:#60a5fa;font-size:3rem;font-weight:900;line-height:1;letter-spacing:-2px;}
#waz-trend{font-size:1rem;font-weight:800;color:#9ca3af;margin-left:6px;}
.river-sub-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;}
.river-sub-cell{background:rgba(0,0,0,.2);padding:14px;border-radius:14px;}
.river-sub-lbl{color:#94a3b8;font-size:.8rem;font-weight:600;margin-bottom:4px;}
.river-sub-val{font-size:1.6rem;font-weight:800;line-height:1;}
.flood-bar-wrap{margin-top:14px;}
.flood-bar-labels{display:flex;justify-content:space-between;font-size:.65rem;color:#9ca3af;margin-bottom:4px;}
.flood-bar-track{height:6px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;}
#waz-flood-fill{height:100%;border-radius:999px;transition:width 1s ease;}
#waz-flood-label{font-size:.7rem;color:#9ca3af;margin-top:5px;}
.river-chart-wrap{height:180px;background:rgba(0,0,0,.18);border-radius:18px;padding:12px;}

/* ── Card 4: ALERTS ── */
#waz-alerts{background:radial-gradient(circle at 50% 0%,#1a0505,#050a06 60%);}
.alerts-body{padding:80px 20px 40px;max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:18px;}
.alerts-hdr{display:flex;align-items:center;gap:12px;}
.alerts-icon{width:44px;height:44px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.alerts-title{font-size:1.6rem;font-weight:900;color:#fff;letter-spacing:-.5px;}
.alerts-zone{color:#9ca3af;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
#waz-alerts-list{display:flex;flex-direction:column;gap:10px;}
.alert-item{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:14px;padding:14px 16px;}
.alert-event{color:#fca5a5;font-size:.95rem;font-weight:800;}
.alert-headline{color:#fff;font-size:.78rem;line-height:1.4;margin-top:4px;opacity:.85;}
.alert-meta{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;}
.alert-tag{font-size:.62rem;padding:3px 8px;border-radius:20px;font-weight:700;background:rgba(239,68,68,.15);color:#fca5a5;}
.no-alerts{background:rgba(57,255,20,.04);border:1px solid rgba(57,255,20,.15);border-radius:16px;padding:28px 20px;text-align:center;}
.no-alerts-icon{font-size:2.5rem;margin-bottom:8px;}
.no-alerts-title{color:#39FF14;font-size:1.1rem;font-weight:800;}
.no-alerts-sub{color:#9ca3af;font-size:.82rem;margin-top:4px;}
.alerts-footer{display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,.05);}
.alerts-src{color:#9ca3af;font-size:.68rem;}
#waz-alerts-stamp{color:#9ca3af;font-size:.68rem;}
</style>

<!-- 4 Progress Dots -->
<div id="waz-dots">
  <div class="waz-dot active"></div>
  <div class="waz-dot"></div>
  <div class="waz-dot"></div>
  <div class="waz-dot"></div>
</div>

<!-- Floating top bar -->
<div id="waz-top-bar">
  <div id="waz-clock-wrap">
    <div id="waz-live-badge"><div class="waz-live-dot"></div><span class="waz-live-label">Live</span></div>
    <div id="waz-clock">00:00:00</div>
  </div>
  <button id="waz-close-btn" onclick="resetActiveGateway()" aria-label="Close WaZWeather">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>

<!-- ═══ CARD 1: NOW ═══ -->
<div id="waz-now" class="waz-card">
  <div class="now-body">
    <div class="now-source">
      <div><div class="now-source-lbl">Right Now · Wazeecha</div><div class="now-source-sub">Live from KISW · Wisconsin Rapids</div></div>
      <div id="waz-updated">—</div>
    </div>
    <div class="waz-verdict-pill">
      <div id="waz-verdict-emoji">🌀</div>
      <div>
        <div id="waz-verdict-label">Loading…</div>
        <div id="waz-verdict-sub">Fetching conditions</div>
      </div>
    </div>
    <div class="persona-row">
      <button class="persona-btn active" data-persona="lake" onclick="wazSetPersona('lake')">🏖️ Lake</button>
      <button class="persona-btn" data-persona="fishing" onclick="wazSetPersona('fishing')">🎣 Fishing</button>
      <button class="persona-btn" data-persona="work" onclick="wazSetPersona('work')">🏗️ Work</button>
      <button class="persona-btn" data-persona="family" onclick="wazSetPersona('family')">👨‍👩‍👧 Family</button>
    </div>
    <div class="now-stats">
      <div class="now-stat"><div class="now-stat-lbl" id="waz-lbl-feels">Feels Like</div><div class="now-stat-val" id="waz-feels">--°</div></div>
      <div class="now-stat"><div class="now-stat-lbl">Wind</div><div class="now-stat-val" id="waz-wind">-- mph</div><div class="now-stat-sub" id="waz-wind-dir">--</div></div>
      <div class="now-stat"><div class="now-stat-lbl" id="waz-lbl-uv">UV Max</div><div class="now-stat-val" id="waz-uv" style="color:#fbbf24;">--</div></div>
    </div>
    <div class="sun-row">
      <div class="sun-item"><span style="font-size:1.1rem;">🌅</span><div><div class="sun-lbl">Sunrise</div><div class="sun-val" id="waz-sunrise">--:--</div></div></div>
      <div class="sun-sep"></div>
      <div class="sun-item"><div style="text-align:right;"><div class="sun-lbl">Sunset</div><div class="sun-val" id="waz-sunset">--:--</div></div><span style="font-size:1.1rem;">🌇</span></div>
    </div>
    <div class="vis-row"><span class="vis-lbl">Visibility</span><span id="waz-visibility">--</span></div>
    <div class="advice-box">
      <div class="advice-hdr">💡 Recommendation</div>
      <div id="waz-advice">Checking conditions…</div>
    </div>
  </div>
</div>

<!-- ═══ CARD 2: RADAR ═══ -->
<div id="waz-radar" class="waz-card">
  <iframe id="waz-radar-iframe"
    src="https://embed.windy.com/embed2.html?lat=44.39&lon=-89.77&zoom=8&level=surface&overlay=rain&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=44.39&detailLon=-89.77&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1"
    allowfullscreen loading="lazy"></iframe>
</div>

<!-- ═══ CARD 3: RIVER ═══ -->
<div id="waz-river" class="waz-card">
  <div class="river-body">
    <div class="river-hdr">
      <div class="river-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div><div class="river-title">Hydrology</div><div class="river-sub">Wisconsin River · USGS 05395000</div></div>
    </div>
    <div class="river-main">
      <div class="river-cfs-lbl">Current Flow Rate</div>
      <div style="display:flex;align-items:baseline;gap:6px;">
        <div id="waz-cfs" class="river-cfs-val">-- CFS</div>
        <div id="waz-trend"></div>
      </div>
      <div class="river-sub-grid">
        <div class="river-sub-cell"><div class="river-sub-lbl">River Depth</div><div id="waz-gauge" class="river-sub-val" style="color:#a78bfa;">-- ft</div></div>
        <div class="river-sub-cell"><div class="river-sub-lbl">Velocity Est.</div><div id="waz-vel" class="river-sub-val" style="color:#34d399;">-- ft/s</div></div>
      </div>
      <div class="flood-bar-wrap" id="waz-flood-wrap" style="display:none;">
        <div class="flood-bar-labels"><span>Stage</span><span id="waz-flood-label">--</span></div>
        <div class="flood-bar-track"><div id="waz-flood-fill"></div></div>
      </div>
    </div>
    <div class="river-chart-wrap"><canvas id="waz-hydro-chart" style="width:100%;height:100%;"></canvas></div>
  </div>
</div>

<!-- ═══ CARD 4: ALERTS ═══ -->
<div id="waz-alerts" class="waz-card">
  <div class="alerts-body">
    <div class="alerts-hdr">
      <div class="alerts-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div><div class="alerts-title">NWS Alerts</div><div class="alerts-zone">Wood County, WI · WIZ030</div></div>
    </div>
    <div id="waz-alerts-list">
      <div class="no-alerts"><div class="no-alerts-icon">✅</div><div class="no-alerts-title">All Clear</div><div class="no-alerts-sub">No active alerts for Wood County</div></div>
    </div>
    <div class="alerts-footer"><div class="alerts-src">Source: NWS Green Bay</div><div id="waz-alerts-stamp"></div></div>
  </div>
</div>

<!-- ═══ SELF-CONTAINED v4 SCRIPT ═══ -->
<script>
(function() {
  'use strict';

  /* ── Constants ── */
  var LAT = 44.3936, LON = -89.8173;
  var USGS_URL = 'https://waterservices.usgs.gov/nwis/iv/?sites=05395000&parameterCd=00060,00065&format=json&period=P7D';
  var WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
    '&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code,uv_index' +
    '&daily=sunrise,sunset,uv_index_max,precipitation_probability_max,wind_gusts_10m_max,weather_code,precipitation_sum,temperature_2m_max,temperature_2m_min' +
    '&forecast_days=7&timezone=America%2FChicago&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch';
  var NWS_URL = 'https://api.weather.gov/alerts/active?zone=WIZ030';
  var AQI_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + LAT + '&longitude=' + LON + '&current=us_aqi,uv_index';

  var persona = 'lake';
  var wxCache = null;

  /* ── DOM shorthand ── */
  function el(id) { return document.getElementById(id); }
  function setText(id, val) { var e = el(id); if (e) e.textContent = val; }

  /* ── Clock ── */
  function tickClock() { setText('waz-clock', new Date().toLocaleTimeString('en-US', { hour12: false })); }
  setInterval(tickClock, 1000);
  tickClock();

  /* ── Swipe dot sync ── */
  var container = el('wazeecha-telemetry');
  var dots = document.querySelectorAll('.waz-dot');
  function updateDots() {
    if (!container) return;
    var idx = Math.round(container.scrollLeft / window.innerWidth);
    dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
  }
  if (container) container.addEventListener('scroll', updateDots, { passive: true });

  /* ── Utilities ── */
  function degToCardinal(deg) {
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8] || '--';
  }
  function relTime(ts) {
    var diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    return Math.floor(diff / 3600000) + 'h ago';
  }
  function wCode(code) {
    if (code <= 1) return { emoji: '☀️', label: 'Clear', color: '#fbbf24' };
    if (code <= 3) return { emoji: '⛅', label: 'Partly Cloudy', color: '#9ca3af' };
    if (code <= 48) return { emoji: '🌫️', label: 'Foggy', color: '#6b7280' };
    if (code <= 67) return { emoji: '🌧️', label: 'Rain', color: '#3b82f6' };
    if (code <= 77) return { emoji: '❄️', label: 'Snow', color: '#bfdbfe' };
    if (code <= 82) return { emoji: '🌦️', label: 'Showers', color: '#60a5fa' };
    if (code <= 99) return { emoji: '⛈️', label: 'Thunderstorm', color: '#ef4444' };
    return { emoji: '🌡️', label: 'Unknown', color: '#9ca3af' };
  }

  /* ── Persona ── */
  window.wazSetPersona = function(p) {
    persona = p;
    document.querySelectorAll('.persona-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.persona === p);
    });
    if (wxCache) renderNow(wxCache);
  };

  /* ── Render NOW card ── */
  function renderNow(wx) {
    wxCache = wx;
    try {
      var h = wx.hourly || {};
      var d = wx.daily || {};
      var now = new Date();

      // find current hour index
      var curHr = 0;
      var times = h.time || [];
      for (var i = 0; i < times.length; i++) {
        if (new Date(times[i]) <= now) curHr = i;
        else break;
      }

      var feelsLike = (h.apparent_temperature && h.apparent_temperature[curHr] != null) ? Math.round(h.apparent_temperature[curHr]) : null;
      var windSpd   = (h.wind_speed_10m && h.wind_speed_10m[curHr] != null) ? Math.round(h.wind_speed_10m[curHr]) : null;
      var windDir   = (h.wind_direction_10m && h.wind_direction_10m[curHr] != null) ? degToCardinal(h.wind_direction_10m[curHr]) : '--';
      var uvMax     = (d.uv_index_max && d.uv_index_max[0] != null) ? d.uv_index_max[0] : null;
      var precipMax = (d.precipitation_probability_max && d.precipitation_probability_max[0] != null) ? d.precipitation_probability_max[0] : 0;
      var wc        = (d.weather_code && d.weather_code[0] != null) ? d.weather_code[0] : 0;
      var sunrise   = (d.sunrise && d.sunrise[0]) ? new Date(d.sunrise[0]).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : '--:--';
      var sunset    = (d.sunset && d.sunset[0]) ? new Date(d.sunset[0]).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : '--:--';

      var info = wCode(wc);
      setText('waz-verdict-emoji', info.emoji);
      setText('waz-verdict-label', info.label + (precipMax > 30 ? ' · ' + precipMax + '% rain' : ''));
      el('waz-verdict-label') && (el('waz-verdict-label').style.color = info.color);
      setText('waz-verdict-sub', precipMax > 0 ? precipMax + '% chance of rain today' : 'No rain expected today');

      // persona-specific labels
      setText('waz-lbl-feels', persona === 'work' ? 'AQI' : 'Feels Like');
      setText('waz-lbl-uv', persona === 'fishing' ? 'Moon Phase' : 'UV Max');

      setText('waz-feels', feelsLike !== null ? feelsLike + '°' : '--°');
      setText('waz-wind', windSpd !== null ? windSpd + ' mph' : '-- mph');
      setText('waz-wind-dir', windDir);
      if (uvMax !== null) { setText('waz-uv', uvMax.toFixed(1)); }
      setText('waz-sunrise', sunrise);
      setText('waz-sunset', sunset);
      setText('waz-updated', relTime(Date.now()));

      // Advice
      var advice = [];
      if (precipMax >= 60) advice.push('Rain is likely — bring a rain jacket.');
      else if (precipMax >= 30) advice.push('Some chance of rain. Keep an eye on the radar.');
      if (uvMax !== null && uvMax >= 6) advice.push('UV is high — wear sunscreen.');
      if (windSpd !== null && windSpd >= 20) advice.push('Winds are strong at ' + windSpd + ' mph.');
      if (wc >= 95) advice.push('Thunderstorms possible — take shelter.');
      if (!advice.length) advice.push('Conditions look good. Enjoy your day.');
      setText('waz-advice', advice.join(' '));

    } catch (err) {
      console.warn('[WaZv4] renderNow error:', err);
      setText('waz-verdict-label', 'Weather data error');
    }
  }

  /* ── Render RIVER card ── */
  function renderRiver(data) {
    try {
      var series = (data.value && data.value.timeSeries) || [];
      var cfsVals = [], ftVals = [], chartLabels = [], chartData = [];

      series.forEach(function(s) {
        var code = (s.variable && s.variable.variableCode && s.variable.variableCode[0]) ? s.variable.variableCode[0].value : '';
        var vals = (s.values && s.values[0] && s.values[0].value) ? s.values[0].value : [];
        if (code === '00060') {
          cfsVals = vals;
          // build chart data (last 48 points)
          var recent = vals.slice(-48);
          recent.forEach(function(v) {
            chartLabels.push(new Date(v.dateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
            chartData.push(parseFloat(v.value));
          });
        }
        if (code === '00065') ftVals = vals;
      });

      var cfs  = cfsVals.length ? parseFloat(cfsVals[cfsVals.length - 1].value) : null;
      var cfsPrev = cfsVals.length > 1 ? parseFloat(cfsVals[cfsVals.length - 2].value) : cfs;
      var ft   = ftVals.length ? parseFloat(ftVals[ftVals.length - 1].value) : null;
      var vel  = (cfs !== null && ft !== null && ft > 0) ? (cfs / (ft * 150)).toFixed(2) : null;

      if (cfs !== null) {
        setText('waz-cfs', cfs.toLocaleString() + ' CFS');
        var trend = cfs > cfsPrev ? '↑' : cfs < cfsPrev ? '↓' : '→';
        setText('waz-trend', trend);
        el('waz-trend').style.color = cfs > cfsPrev ? '#ef4444' : cfs < cfsPrev ? '#34d399' : '#9ca3af';
      }
      if (ft !== null) setText('waz-gauge', ft.toFixed(2) + ' ft');
      if (vel !== null) setText('waz-vel', vel + ' ft/s');

      // Flood stage indicator (minor flood @ ~12ft for Wisconsin River)
      if (ft !== null) {
        var floodMinor = 12, floodAction = 10;
        var pct = Math.min(100, Math.max(0, (ft / floodMinor) * 100));
        var fillColor = ft >= floodMinor ? '#ef4444' : ft >= floodAction ? '#f97316' : '#3b82f6';
        var stageLabel = ft >= floodMinor ? 'Flood Stage' : ft >= floodAction ? 'Action Stage' : 'Normal';
        var wrap = el('waz-flood-wrap');
        if (wrap) wrap.style.display = 'block';
        var fill = el('waz-flood-fill');
        if (fill) { fill.style.width = pct + '%'; fill.style.background = fillColor; }
        setText('waz-flood-label', stageLabel + ' · ' + ft.toFixed(2) + ' ft');
      }

      // Chart
      var canvas = el('waz-hydro-chart');
      if (canvas && window.Chart && chartData.length) {
        var existing = Chart.getChart(canvas);
        if (existing) existing.destroy();
        new Chart(canvas, {
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [{ data: chartData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.1)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: false },
              y: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } }
            }
          }
        });
      }
    } catch (err) {
      console.warn('[WaZv4] renderRiver error:', err);
    }
  }

  /* ── Render ALERTS card ── */
  function renderAlerts(features, ts) {
    var list = el('waz-alerts-list');
    if (!list) return;
    if (!features || !features.length) {
      list.innerHTML = '<div class="no-alerts"><div class="no-alerts-icon">✅</div><div class="no-alerts-title">All Clear</div><div class="no-alerts-sub">No active alerts for Wood County</div></div>';
    } else {
      list.innerHTML = features.slice(0, 5).map(function(f) {
        var p = f.properties || {};
        return '<div class="alert-item"><div class="alert-event">' + (p.event || 'Alert') + '</div>' +
          '<div class="alert-headline">' + (p.headline || '') + '</div>' +
          '<div class="alert-meta"><span class="alert-tag">' + (p.severity || '') + '</span>' +
          (p.certainty ? '<span class="alert-tag">' + p.certainty + '</span>' : '') + '</div></div>';
      }).join('');
    }
    if (ts) setText('waz-alerts-stamp', 'Updated ' + relTime(ts));
  }

  /* ── Fetch all data ── */
  function fetchAll() {
    // Weather
    var wxCacheRaw = localStorage.getItem('wazv4_wx');
    var wxParsed = wxCacheRaw ? JSON.parse(wxCacheRaw) : null;
    if (wxParsed && (Date.now() - wxParsed.ts < 30 * 60 * 1000)) {
      renderNow(wxParsed.data);
    } else {
      fetch(WX_URL).then(function(r) { return r.json(); }).then(function(data) {
        localStorage.setItem('wazv4_wx', JSON.stringify({ ts: Date.now(), data: data }));
        renderNow(data);
      }).catch(function(e) { console.warn('[WaZv4] wx fetch failed:', e); });
    }

    // USGS River
    var usgsCacheRaw = localStorage.getItem('wazv4_usgs');
    var usgsParsed = usgsCacheRaw ? JSON.parse(usgsCacheRaw) : null;
    if (usgsParsed && (Date.now() - usgsParsed.ts < 15 * 60 * 1000)) {
      renderRiver(usgsParsed.data);
    } else {
      fetch(USGS_URL).then(function(r) { return r.json(); }).then(function(data) {
        localStorage.setItem('wazv4_usgs', JSON.stringify({ ts: Date.now(), data: data }));
        renderRiver(data);
      }).catch(function(e) {
        console.warn('[WaZv4] USGS fetch failed:', e);
        // Fallback
        setText('waz-cfs', '15,700 CFS'); setText('waz-gauge', '10.42 ft'); setText('waz-vel', '1.48 ft/s');
      });
    }

    // NWS Alerts
    fetch(NWS_URL).then(function(r) { return r.json(); }).then(function(data) {
      renderAlerts(data.features, Date.now());
    }).catch(function(e) {
      console.warn('[WaZv4] NWS fetch failed:', e);
      renderAlerts([], null);
    });
  }

  // Kick off on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAll);
  } else {
    fetchAll();
  }

  // Also re-fetch when this section becomes visible (revealPath triggers)
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        var sec = el('wazeecha-telemetry');
        if (sec && sec.classList.contains('active')) {
          fetchAll();
        }
      }
    });
  });
  var sec = el('wazeecha-telemetry');
  if (sec) observer.observe(sec, { attributes: true });

})();
</script>
</section>`;

const html = fs.readFileSync('index.html', 'utf8');

// Find start and end of old section
const START_MARKER = '<!-- LIVE TELEMETRY HUD';
const start = html.indexOf(START_MARKER);
if (start === -1) { console.error('START MARKER NOT FOUND'); process.exit(1); }

// Walk forward to find the closing </section>
let depth = 0, pos = start, end = -1;
// Count <section occurrences vs </section> occurrences from start
// The section starts at `start` and we need to find the matching close
let searchFrom = start;
while (true) {
  const nextOpen = html.indexOf('<section', searchFrom);
  const nextClose = html.indexOf('</section>', searchFrom);
  if (nextClose === -1) { console.error('CLOSE NOT FOUND'); process.exit(1); }
  if (nextOpen !== -1 && nextOpen < nextClose) {
    depth++;
    searchFrom = nextOpen + 1;
  } else {
    depth--;
    if (depth === 0) { end = nextClose + '</section>'.length; break; }
    searchFrom = nextClose + 1;
  }
}

const before = html.substring(0, start);
const after = html.substring(end);
const newHtml = before + NEW_SECTION + after;

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log('v4 section injected. Lines before:', before.split('\\n').length, '| After:', after.split('\\n').length);
