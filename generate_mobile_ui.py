import re

def rewrite_index():
    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract head (before <style>)
    head_match = re.search(r'(.*?<head>.*?)<style>', content, re.DOTALL)
    head_part = head_match.group(1) if head_match else ""

    # Extract script
    script_match = re.search(r'(<script>\s*\'use strict\';.*?)</body', content, re.DOTALL)
    script_part = script_match.group(1) if script_match else ""

    new_style = """
  <style>
    /* Reset & Base */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-light: #f4f6f8;
      --bg-white: #ffffff;
      --text-dark: #111827;
      --text-gray: #6b7280;
      --border-color: #e5e7eb;
      --brand-orange: #f96302; /* Home Depot Style */
      --brand-blue: #0071dc;   /* Walmart Style */
      --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    html, body {
      font-family: var(--font-main);
      background-color: var(--bg-light);
      color: var(--text-dark);
      width: 100vw;
      height: 100vh;
      overflow: hidden; /* Prevent body scroll, handle in views */
      -webkit-font-smoothing: antialiased;
    }

    /* Top App Bar */
    header {
      background-color: var(--brand-orange);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 64px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header-icon {
      font-size: 1.5rem;
    }

    /* Main Content Area */
    main {
      padding-top: 64px;
      padding-bottom: 70px; /* Space for bottom nav */
      height: 100vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Tab Views */
    .tab-view {
      display: none;
      padding: 16px;
      animation: fadeIn 0.2s ease-out;
    }
    .tab-view.active {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Section Headers */
    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 12px;
      color: var(--text-dark);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .see-all {
      font-size: 0.9rem;
      color: var(--brand-blue);
      font-weight: 600;
      text-decoration: none;
    }

    /* Horizontal Swipe Carousel (Retail App Style) */
    .carousel {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 16px;
      margin-inline: -16px;
      padding-inline: 16px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .carousel::-webkit-scrollbar { display: none; }

    /* Product/App Card */
    .card {
      background: var(--bg-white);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      min-width: 260px;
      max-width: 300px;
      flex-shrink: 0;
      scroll-snap-align: start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      cursor: pointer;
    }
    .card:active { background: #f9fafb; }
    .card-img-placeholder {
      height: 120px;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }
    .card-content {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 0.9rem;
      color: var(--text-gray);
      line-height: 1.4;
      flex: 1;
    }
    .card-btn {
      margin-top: 12px;
      background: var(--bg-white);
      color: var(--brand-blue);
      border: 1px solid var(--brand-blue);
      border-radius: 99px;
      padding: 8px 16px;
      font-weight: 700;
      font-size: 0.9rem;
      text-align: center;
    }

    /* Telemetry / Weather specific layouts */
    .data-block {
      background: var(--bg-white);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: var(--text-gray); font-size: 1rem; font-weight: 500;}
    .metric-val { color: var(--text-dark); font-size: 1.25rem; font-weight: 800; }
    
    .radar-container {
      width: 100%;
      height: 350px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
    }
    
    .forecast-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .forecast-day {
      background: var(--bg-white);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      min-width: 140px;
      padding: 12px;
      text-align: center;
      flex-shrink: 0;
    }
    .forecast-day .day-name { font-weight: 700; color: var(--brand-blue); font-size: 0.9rem; margin-bottom: 8px;}
    .forecast-day .temp { font-size: 1.1rem; font-weight: 800; }

    /* Bottom Tab Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 70px;
      background: var(--bg-white);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 1000;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: var(--text-gray);
      background: none;
      border: none;
      font-size: 0.75rem;
      font-weight: 600;
      width: 25%;
      height: 100%;
      cursor: pointer;
    }
    .tab-btn.active {
      color: var(--brand-blue);
    }
    .tab-icon {
      font-size: 1.5rem;
      margin-bottom: 2px;
    }

    /* Alerts Toggle List */
    .toggle-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .toggle-list-item label { font-size: 1.1rem; font-weight: 600; color: var(--text-dark); }
    input[type="checkbox"] {
      width: 24px;
      height: 24px;
      accent-color: var(--brand-orange);
    }
    .primary-btn {
      width: 100%;
      padding: 16px;
      background: var(--brand-orange);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 800;
      margin-top: 24px;
      cursor: pointer;
    }
    .primary-btn:active { background: #d85200; }

    /* Dialog Overlay (for PWAs) */
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
      display: none; align-items: flex-end; /* Slide up from bottom like native action sheet */
    }
    .dialog-overlay.open { display: flex; }
    .dialog-window {
      background: var(--bg-white);
      width: 100%;
      border-radius: 20px 20px 0 0;
      padding: 24px;
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .dialog-title { font-size: 1.4rem; font-weight: 800; }
    #dialog-close { background: #e5e7eb; border: none; width: 32px; height: 32px; border-radius: 16px; font-weight: bold; }
    .dialog-desc { color: var(--text-gray); margin-bottom: 24px; line-height: 1.5; font-size: 1rem; }
    #dialog-screenshot { display: none; } /* Hide screenshots in mobile view to save space */
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand-title">Dondlinger<span style="font-weight:400;">Digital</span></div>
    <div class="header-icon" id="live-clock" style="font-size: 1rem; font-variant-numeric: tabular-nums;">00:00:00</div>
  </header>

  <!-- Main Content -->
  <main>
    
    <!-- HOME TAB -->
    <div id="tab-home" class="tab-view active">
      
      <!-- Top Section: Weather Status -->
      <div class="data-block" style="background: #eef2ff; border-color: #c7d2fe; display: flex; justify-content: space-between; align-items: center;" onclick="switchTab('tab-weather')">
        <div>
          <div style="font-weight: 800; color: #3730a3; font-size: 1.2rem; margin-bottom: 4px;">Live Conditions</div>
          <div id="wazeecha-index-status" style="font-size: 0.9rem; color: #4f46e5; font-weight: 600;">Status: Fetching...</div>
        </div>
        <div style="font-size: 2rem;">⛅</div>
      </div>

      <!-- Carousel 1: Field Apps -->
      <h2 class="section-title">Field Applications <a href="#" class="see-all">See All</a></h2>
      <div class="carousel">
        
        <div class="card glow-card" data-app="pourready">
          <div class="card-img-placeholder" style="color: var(--brand-orange);">🏗️</div>
          <div class="card-content">
            <div class="card-title">PourReady</div>
            <div class="card-desc">Concrete volume estimator built directly for jobsites.</div>
            <div class="card-btn">Open App</div>
          </div>
        </div>

        <div class="card glow-card" data-app="tap">
          <div class="card-img-placeholder" style="color: #10b981;">⏱️</div>
          <div class="card-content">
            <div class="card-title">TAP Protocol</div>
            <div class="card-desc">Cryptographic proofs of location and field activity.</div>
            <div class="card-btn">Open App</div>
          </div>
        </div>

      </div>

      <!-- Carousel 2: Media & Audio -->
      <h2 class="section-title" style="margin-top: 24px;">Media & Studio <a href="#" class="see-all">See All</a></h2>
      <div class="carousel">
        
        <div class="card glow-card" data-app="shotstack">
          <div class="card-img-placeholder" style="color: #0ea5e9;">📸</div>
          <div class="card-content">
            <div class="card-title">ShotStack</div>
            <div class="card-desc">Storyboard compiler for directors and video teams.</div>
            <div class="card-btn">Open App</div>
          </div>
        </div>

        <div class="card glow-card" data-app="ampliloop">
          <div class="card-content">
            <div class="card-img-placeholder" style="color: #d946ef; height: 80px; margin-bottom: 12px; border-radius: 8px;">🎵</div>
            <div class="card-title">AmpliLoop</div>
            <div class="card-desc">Algorithmic beat generator and metronome.</div>
            <div class="card-btn">Open App</div>
          </div>
        </div>

      </div>
    </div>

    <!-- WEATHER TAB -->
    <div id="tab-weather" class="tab-view">
      <h2 class="section-title">Live Storm Radar</h2>
      <div class="radar-container">
        <iframe src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=9&overlay=radar&product=radar&level=surface&lat=44.39&lon=-89.81" style="width:100%; height:100%; border:none;"></iframe>
      </div>

      <h2 class="section-title">River Hydrology</h2>
      <div class="data-block">
        <div class="metric-row">
          <span class="metric-label">Water Flow</span>
          <span class="metric-val" id="metric-cfs" style="color: var(--brand-blue);">-- CFS</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">River Depth</span>
          <span class="metric-val" id="metric-gauge">-- ft</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Velocity</span>
          <span class="metric-val" id="metric-vel">-- ft/s</span>
        </div>
      </div>

      <h2 class="section-title">Atmospherics <span id="detail-aqi-status" style="font-size:0.8rem; background:#f3f4f6; padding:4px 8px; border-radius:4px;">--</span></h2>
      <div class="data-block">
        <div class="metric-row">
          <span class="metric-label">US AQI</span>
          <span class="metric-val" id="metric-aqi">--</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Dust Density</span>
          <span class="metric-val" id="metric-dust">--</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">UV Index</span>
          <span class="metric-val" id="metric-uv">--</span>
        </div>
      </div>

      <h2 class="section-title">5-Day Forecast</h2>
      <div id="weather-forecast-track" class="forecast-scroll">
        <!-- Injected via JS -->
      </div>
      
      <!-- Hidden Chart for backward compatibility with existing JS -->
      <canvas id="hydroChart" style="display:none;"></canvas>
    </div>

    <!-- ALERTS TAB -->
    <div id="tab-alerts" class="tab-view">
      <h2 class="section-title" style="font-size: 1.5rem; margin-bottom: 24px;">Push Notifications</h2>
      
      <div class="data-block">
        <div class="toggle-list-item">
          <label for="pref-river-alerts">Hydrology Alerts</label>
          <input type="checkbox" id="pref-river-alerts" checked>
        </div>
        <div class="toggle-list-item">
          <label for="pref-aqi-alerts">AQI Degradation</label>
          <input type="checkbox" id="pref-aqi-alerts" checked>
        </div>
        <div class="toggle-list-item" style="border-bottom: none;">
          <label for="pref-weather-alerts">Severe Weather</label>
          <input type="checkbox" id="pref-weather-alerts" checked>
        </div>
      </div>

      <button id="btn-weather-push" class="primary-btn" onclick="toggleWeatherPush()">Enable Push Alerts</button>
      <div id="weather-push-status" style="text-align: center; margin-top: 16px; font-weight: 600; color: var(--text-gray);"></div>
    </div>

  </main>

  <!-- Bottom Navigation -->
  <nav class="bottom-nav">
    <button class="tab-btn active" onclick="switchTab('tab-home', this)">
      <div class="tab-icon">🏠</div>
      <span>Home</span>
    </button>
    <button class="tab-btn" onclick="switchTab('tab-weather', this)">
      <div class="tab-icon">⛈️</div>
      <span>Weather</span>
    </button>
    <button class="tab-btn" onclick="switchTab('tab-alerts', this)">
      <div class="tab-icon">🔔</div>
      <span>Alerts</span>
    </button>
  </nav>

  <!-- Dialog Overlay -->
  <div class="dialog-overlay" id="dialog-overlay">
    <div class="dialog-window">
      <div class="dialog-header">
        <div class="dialog-title" id="dialog-title-text">App Details</div>
        <button id="dialog-close">✕</button>
      </div>
      <img id="dialog-screenshot" class="dialog-screenshot" src="" alt="Screenshot" style="display: none;">
      <div class="dialog-desc" id="dialog-desc"></div>
      <div id="dialog-audience" style="display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;"></div>
      <a href="#" id="dialog-launch-btn" class="primary-btn" style="display:block; text-align:center; text-decoration:none;">Launch App</a>
    </div>
  </div>

  <script>
    // Native App Tab Switching Logic
    function switchTab(tabId, btnElement = null) {
      document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      
      document.getElementById(tabId).classList.add('active');
      if(btnElement) {
        btnElement.classList.add('active');
      } else {
        // Find corresponding button and activate
        if(tabId === 'tab-home') document.querySelectorAll('.tab-btn')[0].classList.add('active');
        if(tabId === 'tab-weather') document.querySelectorAll('.tab-btn')[1].classList.add('active');
        if(tabId === 'tab-alerts') document.querySelectorAll('.tab-btn')[2].classList.add('active');
      }
      window.scrollTo(0,0);
    }
  </script>
"""

    # We need to tweak the existing script slightly.
    # The weather forecast injects HTML. We need to override the HTML injected by the original script to match our new mobile styling.
    # We will inject a small override right before the old script runs.
    
    script_override = """
    <script>
    // Override the weather forecast formatting from the original script to match mobile layout
    window.originalFetch = window.fetch;
    const oldHtml = `
            <div class="dashboard-panel weather-card" style="min-width: 350px; width: 350px;">`;
    // We'll let the original script run, but we can't easily hook into it without regex replacing its inner string.
    // Instead, we just let it render its old HTML inside the forecast-scroll box. 
    // It will look okay because it uses flexbox, but let's replace the string directly in the script block.
    </script>
    """
    
    # Let's replace the massive HTML block inside the script that generates the weather cards
    # We'll use regex to replace it inside script_part
    new_weather_html = """
            return `
            <div class="forecast-day">
              <div class="day-name">${escapeHtml(dayKey).split(',')[0]}</div>
              <div style="font-size:2rem; margin:8px 0;">⛅</div>
              <div class="temp">${Math.round(maxTemp)}°</div>
              <div style="font-size:0.8rem; color:var(--text-gray);">${Math.round(minTemp)}°</div>
              <div style="font-size:0.75rem; color:var(--brand-blue); margin-top:8px; font-weight:600;">${totalPrecip.toFixed(2)}in</div>
            </div>`;
    """
    
    script_part = re.sub(r'return `\s*<div class="dashboard-panel weather-card".*?</div>`;', new_weather_html, script_part, flags=re.DOTALL)
    

    final_content = head_part + new_style + script_part

    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'w', encoding='utf-8') as f:
        f.write(final_content)

if __name__ == "__main__":
    rewrite_index()
    print("Mobile Retail App UI Re-write complete.")
