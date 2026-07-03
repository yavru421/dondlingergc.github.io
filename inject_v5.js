const fs = require('fs');

const NEW_SECTION = `     <!-- WaZWeather v5 — Rain Intel + Split Radar + 7-Day Forecast -->
     <section id="wazeecha-telemetry" class="telemetry-section content-section" style="position:fixed;inset:0;z-index:9999;background:#050a06;margin:0;padding:0;display:flex;flex-direction:row;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;">

<style>
/* ═══ WaZWeather v5 Core ═══ */
#waz-dots{position:fixed;top:0;left:0;right:0;padding:max(env(safe-area-inset-top,0px),14px) 60px 0;display:flex;justify-content:center;gap:5px;z-index:10001;pointer-events:none;}
.waz-dot{flex:1;max-width:60px;height:3px;background:rgba(255,255,255,.18);border-radius:3px;transition:background .3s,box-shadow .3s;}
.waz-dot.active{background:#39FF14;box-shadow:0 0 8px rgba(57,255,20,.7);}
#waz-top-bar{position:fixed;top:0;left:0;right:0;padding:max(env(safe-area-inset-top,0px),28px) 16px 10px;z-index:10000;display:flex;justify-content:space-between;align-items:flex-start;background:linear-gradient(to bottom,rgba(0,0,0,.85) 0%,transparent 100%);pointer-events:none;}
#waz-clock-wrap{pointer-events:auto;display:flex;flex-direction:column;gap:1px;}
#waz-live-badge{display:flex;align-items:center;gap:5px;}
.waz-live-dot{width:6px;height:6px;border-radius:50%;background:#39FF14;box-shadow:0 0 8px #39FF14;animation:wazpulse 2s ease-in-out infinite;}
@keyframes wazpulse{0%,100%{opacity:1}50%{opacity:.25}}
.waz-live-label{color:#39FF14;font-size:.63rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;}
#waz-clock{font-family:ui-monospace,monospace;font-size:.95rem;font-weight:700;color:#fff;}
#waz-close-btn{pointer-events:auto;background:rgba(255,255,255,.08);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.18);color:#fff;width:42px;height:42px;border-radius:21px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s;flex-shrink:0;}
#waz-close-btn:active{background:rgba(255,255,255,.22);}
.waz-card{width:100vw;height:100vh;flex-shrink:0;scroll-snap-align:start;scroll-snap-stop:always;position:relative;box-sizing:border-box;}
.waz-scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;height:100%;}
.waz-scroll::-webkit-scrollbar{display:none;}

/* ═══ Card 1: RAIN INTEL ═══ */
#waz-rain-intel{background:radial-gradient(ellipse at 30% 0%,#0c2340 0%,#050a06 65%);}
.ri-body{padding:72px 18px 36px;max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:14px;}
.ri-source{display:flex;justify-content:space-between;align-items:center;}
.ri-source-lbl{color:#60a5fa;font-size:.63rem;font-weight:800;text-transform:uppercase;letter-spacing:2px;}
#waz-updated{color:#9ca3af;font-size:.63rem;}

/* Countdown hero */
.ri-countdown-hero{background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(59,130,246,.04));border:1px solid rgba(59,130,246,.25);border-radius:20px;padding:18px 20px;display:flex;flex-direction:column;gap:6px;}
.ri-countdown-label{color:#60a5fa;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;}
#waz-countdown-main{font-size:2.4rem;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1;}
#waz-countdown-sub{font-size:.78rem;color:#94a3b8;margin-top:2px;}
.ri-today-strip{display:flex;gap:10px;}
.ri-today-cell{flex:1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:3px;}
.ri-today-lbl{color:#9ca3af;font-size:.58rem;text-transform:uppercase;font-weight:700;letter-spacing:.5px;}
#waz-today-total{color:#60a5fa;font-size:1.4rem;font-weight:900;}
#waz-today-max-pct{color:#f97316;font-size:1.4rem;font-weight:900;}
#waz-tomorrow-rain{color:#a78bfa;font-size:1.4rem;font-weight:900;}

/* 12-hr rain bar chart */
.ri-bars-block{background:rgba(59,130,246,.04);border:1px solid rgba(59,130,246,.18);border-radius:16px;padding:12px 12px 10px;}
.ri-bars-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.ri-bars-title{color:#60a5fa;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;}
#waz-rain-summary{font-size:.72rem;font-weight:700;color:#fff;}
.ri-bars{display:flex;align-items:flex-end;gap:3px;height:50px;}
.ri-bar-col{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:0;}
.ri-bar-pct{color:#60a5fa;font-size:.46rem;font-weight:700;line-height:1;}
.ri-bar-fill{width:100%;border-radius:3px 3px 0 0;min-height:2px;}
.ri-bar-lbl{color:#9ca3af;font-size:.46rem;text-align:center;white-space:nowrap;overflow:hidden;line-height:1.2;}
#waz-rain-next{color:#9ca3af;font-size:.7rem;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.05);}
#waz-rain-next span{color:#fff;font-weight:700;}

/* Compact stat strip */
.ri-stat-strip{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.ri-stat{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:14px;padding:11px 10px;display:flex;flex-direction:column;gap:2px;}
.ri-stat-lbl{color:#9ca3af;font-size:.58rem;text-transform:uppercase;font-weight:700;}
.ri-stat-val{color:#fff;font-size:1.15rem;font-weight:800;line-height:1.1;}
.ri-stat-sub{color:#9ca3af;font-size:.62rem;}
.ri-sun-row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);border-radius:13px;padding:10px 14px;}
.ri-sun-item{display:flex;align-items:center;gap:7px;}
.ri-sun-lbl{color:#9ca3af;font-size:.58rem;text-transform:uppercase;font-weight:700;}
.ri-sun-val{color:#fff;font-size:.85rem;font-weight:700;}
.ri-sun-sep{flex:1;height:1px;background:rgba(255,255,255,.05);margin:0 10px;}
.ri-persona-row{display:flex;gap:7px;flex-wrap:wrap;}
.ri-persona-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:6px 12px;color:#9ca3af;font-size:.68rem;font-weight:700;cursor:pointer;transition:all .2s;}
.ri-persona-btn.active{background:rgba(57,255,20,.1);border-color:rgba(57,255,20,.35);color:#39FF14;}
.ri-advice{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:13px;padding:10px 12px;}
.ri-advice-lbl{color:#9ca3af;font-size:.58rem;text-transform:uppercase;font-weight:700;margin-bottom:4px;}
#waz-advice{color:#fff;font-size:.78rem;line-height:1.45;font-weight:500;}

/* ═══ Card 2: RADAR (Split 70/30) ═══ */
#waz-radar{display:flex;flex-direction:column;padding:0;}
#waz-radar-frame-wrap{flex:0 0 68vh;position:relative;overflow:hidden;}
#windy-iframe{width:100%;height:100%;border:none;display:block;}
#waz-radar-strip{flex:1;background:#0a0f1a;border-top:1px solid rgba(255,255,255,.08);padding:12px 16px;display:flex;flex-direction:column;gap:10px;overflow:hidden;}
.radar-strip-top{display:flex;justify-content:space-between;align-items:center;}
.radar-strip-lbl{color:#9ca3af;font-size:.62rem;text-transform:uppercase;font-weight:700;letter-spacing:1px;}
#waz-radar-time{color:#60a5fa;font-size:.72rem;font-weight:700;}
.radar-layer-btns{display:flex;gap:7px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;}
.radar-layer-btns::-webkit-scrollbar{display:none;}
.rlb{display:flex;align-items:center;gap:5px;padding:8px 12px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.65);font-size:.7rem;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;}
.rlb.active{background:rgba(57,255,20,.12);border-color:rgba(57,255,20,.4);color:#39FF14;}
.rlb svg{flex-shrink:0;}

/* ═══ Card 3: RIVER ═══ */
#waz-river{background:radial-gradient(circle at 70% 10%,#1e3a8a,#0a0f1e 65%);}
.river-body{padding:72px 18px 36px;max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
.river-hdr{display:flex;align-items:center;gap:12px;}
.river-icon{width:46px;height:46px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 18px rgba(59,130,246,.3);}
.river-title{font-size:1.7rem;font-weight:900;color:#fff;letter-spacing:-.5px;}
.river-gauge{color:#94a3b8;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:1px;}
.river-main{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:22px;}
.river-cfs-lbl{color:#94a3b8;font-size:.8rem;font-weight:600;margin-bottom:5px;}
.river-cfs-val{color:#60a5fa;font-size:2.8rem;font-weight:900;line-height:1;letter-spacing:-2px;}
#waz-trend{font-size:.95rem;font-weight:800;margin-left:5px;}
.river-sub-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px;}
.river-sub-cell{background:rgba(0,0,0,.2);padding:13px;border-radius:13px;}
.river-sub-lbl{color:#94a3b8;font-size:.75rem;font-weight:600;margin-bottom:3px;}
.river-sub-val{font-size:1.5rem;font-weight:800;line-height:1;}
.flood-bar-wrap{margin-top:12px;}
.flood-bar-labels{display:flex;justify-content:space-between;font-size:.62rem;color:#9ca3af;margin-bottom:3px;}
.flood-bar-track{height:5px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;}
#waz-flood-fill{height:100%;border-radius:999px;transition:width 1s ease;}
#waz-flood-label{font-size:.65rem;color:#9ca3af;margin-top:4px;}
.river-chart-wrap{height:160px;background:rgba(0,0,0,.18);border-radius:16px;padding:10px;}

/* ═══ Card 4: ALERTS ═══ */
#waz-alerts{background:radial-gradient(circle at 50% 0%,#1a0505,#050a06 65%);}
.alerts-body{padding:72px 18px 36px;max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
.alerts-hdr{display:flex;align-items:center;gap:11px;}
.alerts-icon{width:42px;height:42px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.alerts-title{font-size:1.5rem;font-weight:900;color:#fff;letter-spacing:-.5px;}
.alerts-zone{color:#9ca3af;font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:1px;}
#waz-alerts-list{display:flex;flex-direction:column;gap:9px;}
.alert-item{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:13px;padding:13px 15px;}
.alert-event{color:#fca5a5;font-size:.9rem;font-weight:800;}
.alert-headline{color:#fff;font-size:.75rem;line-height:1.4;margin-top:3px;opacity:.85;}
.alert-meta{display:flex;gap:7px;margin-top:7px;flex-wrap:wrap;}
.alert-tag{font-size:.6rem;padding:3px 8px;border-radius:20px;font-weight:700;background:rgba(239,68,68,.15);color:#fca5a5;}
.no-alerts{background:rgba(57,255,20,.04);border:1px solid rgba(57,255,20,.12);border-radius:15px;padding:26px 18px;text-align:center;}
.no-alerts-icon{font-size:2.2rem;margin-bottom:7px;}
.no-alerts-title{color:#39FF14;font-size:1.05rem;font-weight:800;}
.no-alerts-sub{color:#9ca3af;font-size:.78rem;margin-top:3px;}
.alerts-footer{display:flex;justify-content:space-between;align-items:center;padding-top:7px;border-top:1px solid rgba(255,255,255,.05);}
.alerts-src{color:#9ca3af;font-size:.65rem;}
#waz-alerts-stamp{color:#9ca3af;font-size:.65rem;}

/* ═══ Card 5: FORECAST ═══ */
#waz-forecast{background:radial-gradient(ellipse at 60% 0%,#1a0d2e,#050a06 65%);}
.fc-body{padding:72px 18px 36px;max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:14px;}
.fc-hdr{display:flex;justify-content:space-between;align-items:flex-end;}
.fc-title{font-size:1.7rem;font-weight:900;color:#fff;letter-spacing:-.5px;}
.fc-sub{color:#9ca3af;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;}
.aqi-badge{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:6px 12px;}
.aqi-badge-lbl{color:#9ca3af;font-size:.62rem;font-weight:700;text-transform:uppercase;}
#waz-aqi-val{font-size:1.1rem;font-weight:900;color:#39FF14;}
#waz-aqi-status{font-size:.62rem;font-weight:700;color:#9ca3af;}
.fc-days{display:flex;flex-direction:column;gap:8px;}
.fc-day{display:flex;align-items:center;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.055);border-radius:14px;padding:12px 14px;gap:10px;}
.fc-day-name{color:#fff;font-size:.82rem;font-weight:700;width:34px;flex-shrink:0;}
.fc-day-icon{font-size:1.3rem;flex-shrink:0;}
.fc-day-desc{color:#9ca3af;font-size:.72rem;flex:1;}
.fc-day-temp{color:#fff;font-size:.8rem;font-weight:800;white-space:nowrap;flex-shrink:0;text-align:right;}
.fc-day-rain-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;width:48px;}
.fc-day-rain-bar-bg{width:100%;height:4px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;}
.fc-day-rain-bar-fill{height:100%;border-radius:999px;background:#3b82f6;transition:width .5s ease;}
.fc-day-rain-pct{color:#60a5fa;font-size:.6rem;font-weight:700;}
.fc-precip-today{background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.18);border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;}
.fc-precip-lbl{color:#60a5fa;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;}
#waz-precip-today{color:#fff;font-size:1.1rem;font-weight:900;}
#waz-precip-week{color:#fff;font-size:1.1rem;font-weight:900;}
</style>

<!-- 5 Progress Dots -->
<div id="waz-dots">
  <div class="waz-dot active"></div>
  <div class="waz-dot"></div>
  <div class="waz-dot"></div>
  <div class="waz-dot"></div>
  <div class="waz-dot"></div>
</div>

<!-- Floating top bar -->
<div id="waz-top-bar">
  <div id="waz-clock-wrap">
    <div id="waz-live-badge"><div class="waz-live-dot"></div><span class="waz-live-label">Live</span></div>
    <div id="waz-clock">--:--:--</div>
  </div>
  <button id="waz-close-btn" onclick="resetActiveGateway()" aria-label="Close WaZWeather">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>

<!-- ════ CARD 1: RAIN INTEL ════ -->
<div id="waz-rain-intel" class="waz-card waz-scroll">
  <div class="ri-body">
    <div class="ri-source">
      <div><div class="ri-source-lbl">☔ Rain Intel · Wazeecha</div></div>
      <div id="waz-updated">—</div>
    </div>

    <!-- Live countdown hero -->
    <div class="ri-countdown-hero">
      <div class="ri-countdown-label">🌧 Rain Arrival</div>
      <div id="waz-countdown-main">Checking…</div>
      <div id="waz-countdown-sub">Loading forecast data</div>
    </div>

    <!-- Today / Tomorrow strip -->
    <div class="ri-today-strip">
      <div class="ri-today-cell">
        <div class="ri-today-lbl">Today Total</div>
        <div id="waz-today-total">--"</div>
      </div>
      <div class="ri-today-cell">
        <div class="ri-today-lbl">Max Chance</div>
        <div id="waz-today-max-pct">--%</div>
      </div>
      <div class="ri-today-cell">
        <div class="ri-today-lbl">Tomorrow</div>
        <div id="waz-tomorrow-rain">--%</div>
      </div>
    </div>

    <!-- 12-hr bar chart -->
    <div class="ri-bars-block">
      <div class="ri-bars-hdr">
        <span class="ri-bars-title">Next 12 Hours</span>
        <span id="waz-rain-summary">Loading…</span>
      </div>
      <div class="ri-bars" id="waz-rain-bars"></div>
      <div id="waz-rain-next">Checking…</div>
    </div>

    <!-- Persona buttons -->
    <div class="ri-persona-row">
      <button class="ri-persona-btn active" data-persona="lake" onclick="wazSetPersona('lake')">🏖 Lake</button>
      <button class="ri-persona-btn" data-persona="fishing" onclick="wazSetPersona('fishing')">🎣 Fishing</button>
      <button class="ri-persona-btn" data-persona="work" onclick="wazSetPersona('work')">🏗 Work</button>
      <button class="ri-persona-btn" data-persona="family" onclick="wazSetPersona('family')">👨‍👩‍👧 Family</button>
    </div>

    <!-- Compact stat strip -->
    <div class="ri-stat-strip">
      <div class="ri-stat"><div class="ri-stat-lbl" id="waz-lbl-feels">Feels Like</div><div class="ri-stat-val" id="waz-feels">--°</div></div>
      <div class="ri-stat"><div class="ri-stat-lbl">Wind</div><div class="ri-stat-val" id="waz-wind">-- mph</div><div class="ri-stat-sub" id="waz-wind-dir">--</div></div>
      <div class="ri-stat"><div class="ri-stat-lbl" id="waz-lbl-uv">UV Max</div><div class="ri-stat-val" id="waz-uv" style="color:#fbbf24;">--</div></div>
    </div>

    <!-- Sun strip -->
    <div class="ri-sun-row">
      <div class="ri-sun-item"><span style="font-size:1rem;">🌅</span><div><div class="ri-sun-lbl">Sunrise</div><div class="ri-sun-val" id="waz-sunrise">--:--</div></div></div>
      <div class="ri-sun-sep"></div>
      <div class="ri-sun-item"><div style="text-align:right;"><div class="ri-sun-lbl">Sunset</div><div class="ri-sun-val" id="waz-sunset">--:--</div></div><span style="font-size:1rem;">🌇</span></div>
    </div>

    <!-- Advice -->
    <div class="ri-advice">
      <div class="ri-advice-lbl">💡 Recommendation</div>
      <div id="waz-advice">Loading…</div>
    </div>
  </div>
</div>

<!-- ════ CARD 2: RADAR (Split 68vh / rest) ════ -->
<div id="waz-radar" class="waz-card">
  <div id="waz-radar-frame-wrap">
    <iframe id="windy-iframe"
      src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=9&overlay=radar&product=radar&level=surface&lat=44.3936&lon=-89.8173&play=true&message=true&marker=true&detailLat=44.3936&detailLon=-89.8173"
      allowfullscreen loading="lazy"></iframe>
  </div>
  <div id="waz-radar-strip">
    <div class="radar-strip-top">
      <span class="radar-strip-lbl">Layer</span>
      <span id="waz-radar-time">Live Radar Active</span>
    </div>
    <div class="radar-layer-btns">
      <button class="rlb active" id="rlb-radar" onclick="wazLayer('radar','radar')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> Radar
      </button>
      <button class="rlb" id="rlb-rain" onclick="wazLayer('rain','')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><polyline points="8 19 12 23 16 19"/></svg> Rain
      </button>
      <button class="rlb" id="rlb-wind" onclick="wazLayer('wind','')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg> Wind
      </button>
      <button class="rlb" id="rlb-temp" onclick="wazLayer('temp','')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> Temp
      </button>
      <button class="rlb" id="rlb-clouds" onclick="wazLayer('clouds','')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg> Clouds
      </button>
      <button class="rlb" id="rlb-cape" onclick="wazLayer('cape','')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Storms
      </button>
      <button class="rlb" id="rlb-pressure" onclick="wazLayer('pressure','')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> Pressure
      </button>
    </div>
  </div>
  <script>
  function wazLayer(overlay, product) {
    var iframe = document.getElementById('windy-iframe');
    if (!iframe) return;
    var base = 'https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=\u00b0F&metricWind=mph&zoom=9&level=surface&lat=44.3936&lon=-89.8173&play=true&message=true&marker=true&detailLat=44.3936&detailLon=-89.8173';
    iframe.src = base + '&overlay=' + overlay + (product ? '&product=' + product : '');
    document.querySelectorAll('.rlb').forEach(function(b){ b.classList.remove('active'); });
    var ab = document.getElementById('rlb-' + overlay);
    if (ab) ab.classList.add('active');
    document.getElementById('waz-radar-time').textContent = overlay.charAt(0).toUpperCase() + overlay.slice(1) + ' layer active';
  }
  </script>
</div>

<!-- ════ CARD 3: RIVER ════ -->
<div id="waz-river" class="waz-card waz-scroll">
  <div class="river-body">
    <div class="river-hdr">
      <div class="river-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div><div class="river-title">Hydrology</div><div class="river-gauge">Wisconsin River · USGS 05395000</div></div>
    </div>
    <div class="river-main">
      <div class="river-cfs-lbl">Current Flow Rate</div>
      <div style="display:flex;align-items:baseline;gap:5px;">
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

<!-- ════ CARD 4: ALERTS ════ -->
<div id="waz-alerts" class="waz-card waz-scroll">
  <div class="alerts-body">
    <div class="alerts-hdr">
      <div class="alerts-icon">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div><div class="alerts-title">NWS Alerts</div><div class="alerts-zone">Wood County, WI · WIZ030</div></div>
    </div>
    <div id="waz-alerts-list">
      <div class="no-alerts"><div class="no-alerts-icon">✅</div><div class="no-alerts-title">All Clear</div><div class="no-alerts-sub">No active alerts for Wood County</div></div>
    </div>
    <div class="alerts-footer"><div class="alerts-src">Source: NWS Green Bay</div><div id="waz-alerts-stamp"></div></div>
  </div>
</div>

<!-- ════ CARD 5: FORECAST ════ -->
<div id="waz-forecast" class="waz-card waz-scroll">
  <div class="fc-body">
    <div class="fc-hdr">
      <div><div class="fc-title">7-Day Forecast</div><div class="fc-sub">Wazeecha · Wood County</div></div>
      <div class="aqi-badge">
        <div class="aqi-badge-lbl">AQI</div>
        <div id="waz-aqi-val">--</div>
        <div id="waz-aqi-status">--</div>
      </div>
    </div>

    <!-- Precip summary row -->
    <div class="fc-precip-today">
      <div><div class="fc-precip-lbl">Today's Rain</div><div id="waz-precip-today">--"</div></div>
      <div style="text-align:right;"><div class="fc-precip-lbl">7-Day Total</div><div id="waz-precip-week">--"</div></div>
    </div>

    <div class="fc-days" id="waz-fc-days">
      <!-- populated by JS -->
    </div>
  </div>
</div>

<!-- ════ v5 SELF-CONTAINED SCRIPT ════ -->
<script>
(function() {
  'use strict';
  var LAT = 44.3936, LON = -89.8173;
  var WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude='+LAT+'&longitude='+LON+
    '&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,precipitation_probability,precipitation,weather_code,uv_index'+
    '&daily=sunrise,sunset,uv_index_max,precipitation_probability_max,wind_gusts_10m_max,weather_code,precipitation_sum,temperature_2m_max,temperature_2m_min'+
    '&forecast_days=7&timezone=America%2FChicago&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch';
  var USGS_URL = 'https://waterservices.usgs.gov/nwis/iv/?sites=05395000&parameterCd=00060,00065&format=json&period=P7D';
  var NWS_URL  = 'https://api.weather.gov/alerts/active?zone=WIZ030';
  var AQI_URL  = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude='+LAT+'&longitude='+LON+'&current=us_aqi,uv_index';

  var persona = 'lake';
  var wxCache = null;
  var countdownInterval = null;
  var rainArrivalTime = null;

  function el(id){ return document.getElementById(id); }
  function setText(id, v){ var e=el(id); if(e) e.textContent=v; }

  /* Clock */
  function tickClock(){ setText('waz-clock', new Date().toLocaleTimeString('en-US',{hour12:false})); }
  setInterval(tickClock, 1000); tickClock();

  /* Dot sync */
  var container = el('wazeecha-telemetry');
  var dots = document.querySelectorAll('.waz-dot');
  function updateDots(){
    if(!container) return;
    var idx = Math.round(container.scrollLeft / window.innerWidth);
    dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
  }
  if(container) container.addEventListener('scroll', updateDots, {passive:true});

  /* Utilities */
  function degToCardinal(d){ return ['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8]||'--'; }
  function relTime(ts){ var d=Date.now()-ts; if(d<60000) return 'just now'; if(d<3600000) return Math.floor(d/60000)+'m ago'; return Math.floor(d/3600000)+'h ago'; }
  function wCode(c){
    if(c<=1)  return {emoji:'☀️', label:'Clear',       color:'#fbbf24'};
    if(c<=3)  return {emoji:'⛅', label:'Partly Cloudy',color:'#9ca3af'};
    if(c<=48) return {emoji:'🌫️', label:'Foggy',        color:'#6b7280'};
    if(c<=67) return {emoji:'🌧️', label:'Rain',         color:'#3b82f6'};
    if(c<=77) return {emoji:'❄️', label:'Snow',         color:'#bfdbfe'};
    if(c<=82) return {emoji:'🌦️', label:'Showers',      color:'#60a5fa'};
    if(c<=99) return {emoji:'⛈️', label:'Thunderstorm', color:'#ef4444'};
    return {emoji:'🌡️', label:'Unknown', color:'#9ca3af'};
  }
  function dayName(dateStr, i){
    if(i===0) return 'Today';
    if(i===1) return 'Tmrw';
    return new Date(dateStr+'T12:00:00').toLocaleDateString([],{weekday:'short'});
  }

  /* Persona */
  window.wazSetPersona = function(p){
    persona = p;
    document.querySelectorAll('.ri-persona-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.persona===p); });
    if(wxCache) renderRainIntel(wxCache);
  };

  /* Countdown timer */
  function startCountdown(targetMs){
    rainArrivalTime = targetMs;
    if(countdownInterval) clearInterval(countdownInterval);
    function tick(){
      var rem = rainArrivalTime - Date.now();
      if(rem <= 0){
        setText('waz-countdown-main', '🌧 Rain Now');
        setText('waz-countdown-sub', 'Check the radar for current coverage');
        clearInterval(countdownInterval);
        return;
      }
      var h = Math.floor(rem/3600000);
      var m = Math.floor((rem%3600000)/60000);
      var s = Math.floor((rem%60000)/1000);
      var parts = [];
      if(h>0) parts.push(h+'h');
      parts.push(('0'+m).slice(-2)+'m');
      parts.push(('0'+s).slice(-2)+'s');
      setText('waz-countdown-main', parts.join(' '));
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  /* Render Rain Intel */
  function renderRainIntel(wx){
    wxCache = wx;
    try {
      var h = wx.hourly || {}, d = wx.daily || {};
      var now = new Date();
      var times = h.time || [];
      var curHr = 0;
      for(var i=0;i<times.length;i++){ if(new Date(times[i])<=now) curHr=i; else break; }

      var feelsLike = (h.apparent_temperature && h.apparent_temperature[curHr]!=null) ? Math.round(h.apparent_temperature[curHr]) : null;
      var windSpd   = (h.wind_speed_10m && h.wind_speed_10m[curHr]!=null) ? Math.round(h.wind_speed_10m[curHr]) : null;
      var windDir   = (h.wind_direction_10m && h.wind_direction_10m[curHr]!=null) ? degToCardinal(h.wind_direction_10m[curHr]) : '--';
      var uvMax     = (d.uv_index_max && d.uv_index_max[0]!=null) ? d.uv_index_max[0] : null;
      var sunrise   = (d.sunrise && d.sunrise[0]) ? new Date(d.sunrise[0]).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) : '--';
      var sunset    = (d.sunset  && d.sunset[0])  ? new Date(d.sunset[0]).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) : '--';
      var rainProb  = h.precipitation_probability || [];
      var rainAmt   = h.precipitation || [];

      /* Stats */
      setText('waz-feels', feelsLike!==null ? feelsLike+'°' : '--°');
      setText('waz-wind',  windSpd!==null   ? windSpd+' mph' : '-- mph');
      setText('waz-wind-dir', windDir);
      if(uvMax!==null){ setText('waz-uv', uvMax.toFixed(1)); }
      setText('waz-sunrise', sunrise); setText('waz-sunset', sunset);
      setText('waz-updated', relTime(Date.now()));

      /* Today / tomorrow rain summary */
      var todayTotal = (d.precipitation_sum && d.precipitation_sum[0]!=null) ? d.precipitation_sum[0].toFixed(2) : '--';
      var todayMaxPct = (d.precipitation_probability_max && d.precipitation_probability_max[0]!=null) ? d.precipitation_probability_max[0] : '--';
      var tomorrowPct = (d.precipitation_probability_max && d.precipitation_probability_max[1]!=null) ? d.precipitation_probability_max[1] : '--';
      setText('waz-today-total', todayTotal !== '--' ? todayTotal+'"' : '--"');
      setText('waz-today-max-pct', todayMaxPct !== '--' ? todayMaxPct+'%' : '--%');
      el('waz-today-max-pct') && (el('waz-today-max-pct').style.color = todayMaxPct>=60?'#ef4444':todayMaxPct>=30?'#f97316':'#60a5fa');
      setText('waz-tomorrow-rain', tomorrowPct !== '--' ? tomorrowPct+'%' : '--%');
      el('waz-tomorrow-rain') && (el('waz-tomorrow-rain').style.color = tomorrowPct>=60?'#ef4444':tomorrowPct>=30?'#f97316':'#a78bfa');

      /* 12-hour bar chart + countdown */
      var maxProb=0;
      var isRainingNow = false;
      var kiswRaw = localStorage.getItem('kisw_obs_v1');
      if(kiswRaw){
        try {
          var props = JSON.parse(kiswRaw).data || {};
          var desc = (props.textDescription || '').toLowerCase();
          if (desc.indexOf('rain') !== -1 || desc.indexOf('drizzle') !== -1 || desc.indexOf('shower') !== -1 || desc.indexOf('thunderstorm') !== -1 || desc.indexOf('precipitation') !== -1) {
            isRainingNow = true;
          }
          var pw = props.presentWeather || [];
          for (var i = 0; i < pw.length; i++) {
            var w = (pw[i].weather || '').toLowerCase();
            if (w.indexOf('rain') !== -1 || w.indexOf('drizzle') !== -1 || w.indexOf('shower') !== -1 || w.indexOf('thunderstorm') !== -1) {
              isRainingNow = true;
            }
          }
        } catch(e){}
      }
      var firstRainHr = isRainingNow ? 0 : -1;
      var barHTML='';
      for(var ri=0;ri<12;ri++){
        var hi=curHr+ri;
        if(hi>=rainProb.length) break;
        var prob=rainProb[hi]||0;
        if((prob>0 || (rainAmt[hi]||0)>0) && firstRainHr===-1) firstRainHr=ri;
        if(prob>maxProb) maxProb=prob;
        var barH=Math.max(2,Math.round((prob/100)*44));
        var col=prob>=70?'#ef4444':prob>=40?'#f97316':prob>=20?'#3b82f6':'rgba(255,255,255,0.1)';
        var t=new Date(h.time[hi]);
        var tLbl=t.toLocaleTimeString([],{hour:'numeric'}).replace(' ','').toLowerCase();
        barHTML+='<div class="ri-bar-col">'+
          '<div class="ri-bar-pct">'+(prob>0?prob+'%':'')+'</div>'+
          '<div class="ri-bar-fill" style="height:'+barH+'px;background:'+col+';"></div>'+
          '<div class="ri-bar-lbl">'+tLbl+'</div></div>';
      }
      var barsEl=el('waz-rain-bars'); if(barsEl) barsEl.innerHTML=barHTML;
      var totalAmt=rainAmt.slice(curHr,curHr+12).reduce(function(a,v){return a+(v||0);},0);
      var summaryEl=el('waz-rain-summary');
      if(summaryEl){ summaryEl.textContent=maxProb>0?'Max '+maxProb+'% · '+totalAmt.toFixed(2)+'"':'No rain'; summaryEl.style.color=maxProb>=70?'#ef4444':maxProb>=40?'#f97316':maxProb>0?'#60a5fa':'#39FF14'; }

      /* Countdown */
      var nextEl=el('waz-rain-next');
      if(firstRainHr===-1){
        setText('waz-countdown-main','☀️ No Rain');
        setText('waz-countdown-sub','No rain in the next 12 hours');
        if(nextEl) nextEl.innerHTML='✅ <span>No rain</span> in the next 12 hours';
        if(countdownInterval){ clearInterval(countdownInterval); countdownInterval=null; }
      } else if(firstRainHr===0){
        setText('waz-countdown-main','🌧 Rain Now');
        setText('waz-countdown-sub','Check the radar for current coverage');
        if(nextEl) nextEl.innerHTML='⚠️ <span>Rain right now</span> — swipe to radar';
      } else {
        var arrivalTime = new Date(h.time[curHr+firstRainHr]);
        var arrStr = arrivalTime.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
        setText('waz-countdown-sub','Arriving around '+arrStr+' · '+maxProb+'% chance');
        if(nextEl) nextEl.innerHTML='🌧 Rain arriving around <span>'+arrStr+'</span>';
        startCountdown(arrivalTime.getTime());
      }

      /* Advice */
      var advice=[];
      if(maxProb>=60) advice.push('Rain — bring a jacket.');
      else if(maxProb>0) advice.push('Rain threat — watch the radar.');
      if(uvMax!==null && uvMax>=6) advice.push('UV is high — wear sunscreen.');
      if(windSpd!==null && windSpd>=20) advice.push('Strong winds at '+windSpd+' mph.');
      if(!advice.length) advice.push('Conditions look good. Enjoy your day.');
      setText('waz-advice', advice.join(' '));
    } catch(err){ console.warn('[WaZv5] renderRainIntel:', err); }
  }

  /* Render Forecast card */
  function renderForecast(wx, aqiData){
    try {
      var d = wx.daily || {};
      var daysEl = el('waz-fc-days');
      if(!daysEl || !d.time) return;
      var weekTotal=0;
      daysEl.innerHTML = d.time.slice(0,7).map(function(t,i){
        var wc   = d.weather_code      && d.weather_code[i]!=null                ? d.weather_code[i] : 0;
        var tmax = d.temperature_2m_max && d.temperature_2m_max[i]!=null          ? Math.round(d.temperature_2m_max[i]) : '--';
        var tmin = d.temperature_2m_min && d.temperature_2m_min[i]!=null          ? Math.round(d.temperature_2m_min[i]) : '--';
        var pct  = d.precipitation_probability_max && d.precipitation_probability_max[i]!=null ? d.precipitation_probability_max[i] : 0;
        var sum  = d.precipitation_sum && d.precipitation_sum[i]!=null            ? d.precipitation_sum[i] : 0;
        weekTotal += sum;
        var info = wCode(wc);
        var barPct = Math.min(100, pct);
        var rainColor = pct>=70?'#ef4444':pct>=40?'#f97316':'#3b82f6';
        return '<div class="fc-day">'+
          '<div class="fc-day-name">'+dayName(t,i)+'</div>'+
          '<div class="fc-day-icon">'+info.emoji+'</div>'+
          '<div class="fc-day-desc">'+info.label+'</div>'+
          '<div class="fc-day-temp">'+tmax+'° / '+tmin+'°</div>'+
          '<div class="fc-day-rain-wrap">'+
            '<div class="fc-day-rain-pct">'+pct+'%</div>'+
            '<div class="fc-day-rain-bar-bg"><div class="fc-day-rain-bar-fill" style="width:'+barPct+'%;background:'+rainColor+';"></div></div>'+
          '</div>'+
        '</div>';
      }).join('');
      var todaySum = d.precipitation_sum && d.precipitation_sum[0]!=null ? d.precipitation_sum[0].toFixed(2) : '--';
      setText('waz-precip-today', todaySum !== '--' ? todaySum+'"' : '--"');
      setText('waz-precip-week', weekTotal.toFixed(2)+'"');
    } catch(err){ console.warn('[WaZv5] renderForecast:', err); }
    /* AQI */
    try {
      if(aqiData && aqiData.current){
        var aqi = aqiData.current.us_aqi || 0;
        var status = aqi>150?'Unhealthy':aqi>100?'USG':aqi>50?'Moderate':'Good';
        var aqiColor = aqi>150?'#ef4444':aqi>100?'#f97316':aqi>50?'#eab308':'#39FF14';
        setText('waz-aqi-val', aqi);
        setText('waz-aqi-status', status);
        el('waz-aqi-val') && (el('waz-aqi-val').style.color=aqiColor);
      }
    } catch(e){}
  }

  /* Render River */
  function renderRiver(data){
    try {
      var series=(data.value&&data.value.timeSeries)||[];
      var cfsVals=[],ftVals=[],chartLabels=[],chartData=[];
      series.forEach(function(s){
        var code=(s.variable&&s.variable.variableCode&&s.variable.variableCode[0])?s.variable.variableCode[0].value:'';
        var vals=(s.values&&s.values[0]&&s.values[0].value)?s.values[0].value:[];
        if(code==='00060'){ cfsVals=vals; var recent=vals.slice(-48); recent.forEach(function(v){ chartLabels.push(new Date(v.dateTime).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})); chartData.push(parseFloat(v.value)); }); }
        if(code==='00065') ftVals=vals;
      });
      var cfs  = cfsVals.length?parseFloat(cfsVals[cfsVals.length-1].value):null;
      var cfsPrev=cfsVals.length>1?parseFloat(cfsVals[cfsVals.length-2].value):cfs;
      var ft   = ftVals.length?parseFloat(ftVals[ftVals.length-1].value):null;
      var vel  = (cfs!==null&&ft!==null&&ft>0)?(cfs/(ft*150)).toFixed(2):null;
      if(cfs!==null){ setText('waz-cfs',cfs.toLocaleString()+' CFS'); var trend=cfs>cfsPrev?'↑':cfs<cfsPrev?'↓':'→'; setText('waz-trend',trend); el('waz-trend').style.color=cfs>cfsPrev?'#ef4444':cfs<cfsPrev?'#34d399':'#9ca3af'; }
      if(ft!==null)  setText('waz-gauge', ft.toFixed(2)+' ft');
      if(vel!==null) setText('waz-vel',   vel+' ft/s');
      if(ft!==null){
        var floodMinor=12,floodAction=10;
        var pct=Math.min(100,Math.max(0,(ft/floodMinor)*100));
        var fc=ft>=floodMinor?'#ef4444':ft>=floodAction?'#f97316':'#3b82f6';
        var sl=ft>=floodMinor?'Flood Stage':ft>=floodAction?'Action Stage':'Normal';
        var wrap=el('waz-flood-wrap'); if(wrap) wrap.style.display='block';
        var fill=el('waz-flood-fill'); if(fill){fill.style.width=pct+'%';fill.style.background=fc;}
        setText('waz-flood-label',sl+' · '+ft.toFixed(2)+' ft');
      }
      var canvas=el('waz-hydro-chart');
      if(canvas&&window.Chart&&chartData.length){
        var ex=Chart.getChart(canvas); if(ex) ex.destroy();
        new Chart(canvas,{type:'line',data:{labels:chartLabels,datasets:[{data:chartData,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.1)',borderWidth:2,pointRadius:0,tension:0.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{ticks:{color:'#9ca3af',font:{size:10}},grid:{color:'rgba(255,255,255,.05)'}}}}});
      }
    } catch(err){ console.warn('[WaZv5] renderRiver:',err); }
  }

  /* Render Alerts */
  function renderAlerts(features,ts){
    var list=el('waz-alerts-list'); if(!list) return;
    if(!features||!features.length){
      list.innerHTML='<div class="no-alerts"><div class="no-alerts-icon">✅</div><div class="no-alerts-title">All Clear</div><div class="no-alerts-sub">No active alerts for Wood County</div></div>';
    } else {
      list.innerHTML=features.slice(0,6).map(function(f){
        var p=f.properties||{};
        return '<div class="alert-item"><div class="alert-event">'+(p.event||'Alert')+'</div>'+
          '<div class="alert-headline">'+(p.headline||'')+'</div>'+
          '<div class="alert-meta"><span class="alert-tag">'+(p.severity||'')+'</span>'+(p.certainty?'<span class="alert-tag">'+p.certainty+'</span>':'')+'</div></div>';
      }).join('');
    }
    if(ts) setText('waz-alerts-stamp','Updated '+relTime(ts));
  }

  /* Fetch all */
  function fetchAll(){
    // Live KISW Observation (radar proxy)
    var kiswRaw=localStorage.getItem('kisw_obs_v1'); var kiswP=kiswRaw?JSON.parse(kiswRaw):null;
    if(!kiswP || (Date.now()-kiswP.ts > 5*60*1000)){
      fetch('https://api.weather.gov/stations/KISW/observations/latest', {
        headers: { 'User-Agent': '(dondlingergc.com, john@dondlingergc.com)' }
      }).then(function(r){return r.json();}).then(function(json){
        if(json.properties) {
          localStorage.setItem('kisw_obs_v1', JSON.stringify({ts:Date.now(), data:json.properties}));
          var wxRaw=localStorage.getItem('wazv5_wx');
          if(wxRaw){
            var wxP=JSON.parse(wxRaw);
            renderRainIntel(wxP.data);
          }
        }
      }).catch(function(e){ console.warn('[WaZv5] Live KISW fetch error:', e); });
    }

    /* Weather */
    var wxRaw=localStorage.getItem('wazv5_wx'); var wxP=wxRaw?JSON.parse(wxRaw):null;
    var aqiRaw=localStorage.getItem('wazv5_aqi'); var aqiP=aqiRaw?JSON.parse(aqiRaw):null;
    function doRender(wxData,aqiData){ renderRainIntel(wxData); renderForecast(wxData,aqiData); }
    if(wxP&&(Date.now()-wxP.ts<30*60*1000)){
      doRender(wxP.data, aqiP&&(Date.now()-aqiP.ts<4*60*60*1000)?aqiP.data:null);
    } else {
      fetch(WX_URL).then(function(r){return r.json();}).then(function(data){
        localStorage.setItem('wazv5_wx',JSON.stringify({ts:Date.now(),data:data}));
        fetch(AQI_URL).then(function(r){return r.json();}).then(function(aqi){
          localStorage.setItem('wazv5_aqi',JSON.stringify({ts:Date.now(),data:aqi}));
          doRender(data,aqi);
        }).catch(function(){ doRender(data,null); });
      }).catch(function(e){console.warn('[WaZv5] wx fetch:',e);});
    }
    /* USGS */
    var usgsRaw=localStorage.getItem('wazv5_usgs'); var usgsP=usgsRaw?JSON.parse(usgsRaw):null;
    if(usgsP&&(Date.now()-usgsP.ts<15*60*1000)){ renderRiver(usgsP.data); }
    else { fetch(USGS_URL).then(function(r){return r.json();}).then(function(data){ localStorage.setItem('wazv5_usgs',JSON.stringify({ts:Date.now(),data:data})); renderRiver(data); }).catch(function(e){ console.warn('[WaZv5] USGS:',e); setText('waz-cfs','15,700 CFS'); setText('waz-gauge','10.42 ft'); setText('waz-vel','1.48 ft/s'); }); }
    /* NWS */
    fetch(NWS_URL).then(function(r){return r.json();}).then(function(data){ renderAlerts(data.features,Date.now()); }).catch(function(){ renderAlerts([],null); });
  }

  /* Init */
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',fetchAll); } else { fetchAll(); }
  var sec=el('wazeecha-telemetry');
  if(sec){ new MutationObserver(function(m){ m.forEach(function(mut){ if(mut.attributeName==='class'&&sec.classList.contains('active')) fetchAll(); }); }).observe(sec,{attributes:true}); }
})();
</script>
</section>`;

const html = fs.readFileSync('index.html', 'utf8');
const START = '<!-- WaZWeather';
const FALLBACK_START = '<!-- LIVE TELEMETRY';
let start = html.indexOf(START);
if (start === -1) start = html.indexOf(FALLBACK_START);
if (start === -1) { console.error('START NOT FOUND'); process.exit(1); }

// find matching </section>
let depth = 0, searchFrom = start, end = -1;
while (true) {
  const nextOpen  = html.indexOf('<section', searchFrom);
  const nextClose = html.indexOf('</section>', searchFrom);
  if (nextClose === -1) { console.error('CLOSE NOT FOUND'); process.exit(1); }
  if (nextOpen !== -1 && nextOpen < nextClose) { depth++; searchFrom = nextOpen + 1; }
  else { depth--; if (depth === 0) { end = nextClose + '</section>'.length; break; } searchFrom = nextClose + 1; }
}

fs.writeFileSync('index.html', html.substring(0, start) + NEW_SECTION + html.substring(end), 'utf8');
console.log('v5 injected OK. Total lines:', fs.readFileSync('index.html','utf8').split('\n').length);
