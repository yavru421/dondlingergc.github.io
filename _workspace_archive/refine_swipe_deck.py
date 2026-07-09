import re

def refine_telemetry():
    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # The telemetry section was inserted in the previous step. We'll find it and replace it with a highly refined version.
    pattern = r'(<section id="wazeecha-telemetry".*?)(<!-- App Grid Section -->)'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("Could not find telemetry section!")
        return
        
    old_section = match.group(1)
    
    # Highly Refined new swipe deck layout
    new_section = """<section id="wazeecha-telemetry" class="telemetry-section content-section" style="width: 100vw; height: 100dvh; position: fixed; inset: 0; z-index: 9999; background: #000; margin: 0; padding: 0; overflow-y: auto; scroll-snap-type: y mandatory; overflow-x: hidden; -webkit-overflow-scrolling: touch; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <!-- FLOATING UI: Top Header -->
    <div style="position:fixed; top:0; left:0; right:0; padding:20px 24px; z-index:10000; display:flex; justify-content:space-between; align-items:flex-start; background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%); pointer-events:none;">
        <div style="display:flex; flex-direction:column; gap:4px; pointer-events:auto;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow: 0 0 10px #10b981;"></div>
                <span style="color:#10b981; font-weight:800; text-transform:uppercase; letter-spacing:2px; font-size:0.75rem;">Live Feed</span>
            </div>
            <div id="live-clock" style="color:white; font-family: 'SF Mono', ui-monospace, monospace; font-size:1.1rem; font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.5);">00:00:00</div>
        </div>
        
        <button onclick="resetActiveGateway()" style="pointer-events:auto; background:rgba(255,255,255,0.1); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.2); color:white; width:44px; height:44px; border-radius:22px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    </div>
    
    <!-- Swipe Indicator -->
    <div style="position:fixed; bottom:40px; left:50%; transform:translateX(-50%); z-index:10000; color:rgba(255,255,255,0.8); display:flex; flex-direction:column; align-items:center; animation: swipeBounce 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; pointer-events:none;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:3px; font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.5);">Swipe</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));"><polyline points="18 15 12 9 6 15"></polyline></svg>
    </div>
    <style>@keyframes swipeBounce { 0%, 100% {transform: translateY(0) translateX(-50%); opacity:0.8;} 50% {transform: translateY(-12px) translateX(-50%); opacity:1;} }</style>

    <!-- CARD 1: THE RADAR HERO -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; position: relative;">
        <!-- Full Bleed Map Background -->
        <iframe src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=9&overlay=radar&product=radar&level=surface&lat=44.31&lon=-89.83" style="width:100%; height:100%; border:none; pointer-events:auto; position:absolute; inset:0;"></iframe>
        
        <!-- Gradient Overlay for Readability -->
        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%); pointer-events:none;"></div>
        
        <!-- Bottom Info Block -->
        <div style="position:absolute; bottom:120px; left:24px; right:24px; color:white; pointer-events:none;">
            <div style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.5); color:#34d399; display:inline-block; padding:6px 14px; border-radius:30px; font-weight:800; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; backdrop-filter:blur(8px);">Atmosphere Optimal</div>
            <h1 style="font-size:3.5rem; font-weight:900; margin:0 0 8px 0; line-height:1; letter-spacing:-1px; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.8));">Storm<br>Radar</h1>
            <p style="font-size:1.1rem; color:rgba(255,255,255,0.7); margin:0; font-weight:500;">Wazeecha Operational Zone</p>
        </div>
    </div>

    <!-- CARD 2: HYDROLOGY -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; background:radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 100%); display:flex; flex-direction:column; justify-content:center; padding:24px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:24px;">
            <div style="display:flex; align-items:center; gap:16px;">
                <div style="width:56px; height:56px; background:linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(59,130,246,0.3);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <div>
                    <h2 style="font-size:2.2rem; font-weight:900; color:white; margin:0; letter-spacing:-0.5px;">Hydrology</h2>
                    <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">River Metrics</div>
                </div>
            </div>
            
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:32px; padding:32px; backdrop-filter:blur(20px);">
                <div style="margin-bottom:32px;">
                    <div style="color:#94a3b8; font-size:1.1rem; font-weight:600; margin-bottom:8px;">Current Flow Rate</div>
                    <div id="metric-cfs" style="color:#60a5fa; font-size:4rem; font-weight:900; line-height:1; letter-spacing:-2px;">-- CFS</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
                    <div style="background:rgba(0,0,0,0.2); padding:16px; border-radius:16px;">
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:8px;">River Depth</div>
                        <div id="metric-gauge" style="color:#a78bfa; font-size:2rem; font-weight:800; line-height:1;">-- ft</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.2); padding:16px; border-radius:16px;">
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:8px;">Velocity</div>
                        <div id="metric-vel" style="color:#34d399; font-size:2rem; font-weight:800; line-height:1;">-- ft/s</div>
                    </div>
                </div>
            </div>
            
            <div style="height:220px; width:100%; background:rgba(0,0,0,0.2); border-radius:24px; padding:16px;">
                <canvas id="hydroChart" style="width:100%; height:100%;"></canvas>
            </div>
        </div>
    </div>

    <!-- CARD 3: ATMOSPHERICS -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; background:radial-gradient(circle at top left, #312e81 0%, #020617 100%); display:flex; flex-direction:column; justify-content:center; padding:24px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div style="width:56px; height:56px; background:linear-gradient(135deg, #f59e0b, #d97706); border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(245,158,11,0.3);">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div>
                        <h2 style="font-size:2.2rem; font-weight:900; color:white; margin:0; letter-spacing:-0.5px;">Air Quality</h2>
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Environmental</div>
                    </div>
                </div>
                <div id="detail-aqi-status" style="font-weight:800; font-size:0.8rem; background:rgba(255,255,255,0.1); padding:8px 16px; border-radius:30px; color:white; backdrop-filter:blur(10px);">--</div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:32px; padding:32px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; backdrop-filter:blur(20px);">
                    <div style="color:#94a3b8; font-size:1.1rem; font-weight:600; margin-bottom:12px;">US AQI</div>
                    <div id="metric-aqi" style="font-size:4.5rem; font-weight:900; line-height:1; color:white; letter-spacing:-2px;">--</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:20px; flex:1; display:flex; flex-direction:column; justify-content:center;">
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:8px;">Dust Density</div>
                        <div id="metric-dust" style="color:#cbd5e1; font-size:1.8rem; font-weight:800; line-height:1;">--</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:20px; flex:1; display:flex; flex-direction:column; justify-content:center;">
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:8px;">UV Index</div>
                        <div id="metric-uv" style="color:#fbbf24; font-size:1.8rem; font-weight:800; line-height:1;">--</div>
                    </div>
                </div>
            </div>
            
            <div style="background:rgba(0,0,0,0.3); border-radius:24px; padding:24px; border:1px solid rgba(255,255,255,0.05);">
                <h3 style="font-size:0.9rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:1px; margin-top:0; margin-bottom:16px;">5-Day Forecast</h3>
                <div id="weather-forecast-track" style="display:flex; gap:16px; overflow-x:auto; padding-bottom:8px; -webkit-overflow-scrolling:touch;"></div>
            </div>
            
            <!-- Hidden elements to keep JS happy -->
            <div id="pollutant-bars" style="display:none;"></div>
            <div id="wazeecha-index-score" style="display:none;"></div>
            <div id="wazeecha-index-status" style="display:none;"></div>
        </div>
    </div>

    <!-- CARD 4: PUSH TERMINAL -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; background:radial-gradient(circle at bottom, #064e3b 0%, #000000 100%); display:flex; flex-direction:column; justify-content:center; padding:24px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto;">
            <div style="text-align:center; margin-bottom:48px;">
                <div style="display:inline-flex; width:80px; height:80px; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); border-radius:40px; align-items:center; justify-content:center; margin-bottom:24px; box-shadow:0 0 30px rgba(52,211,153,0.2);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </div>
                <h2 style="font-size:3rem; font-weight:900; color:white; margin:0 0 16px 0; line-height:1; letter-spacing:-1px;">Push<br>Alerts</h2>
                <p style="font-size:1.1rem; color:#94a3b8; margin:0; line-height:1.5;">Subscribe to encrypted push notifications for critical river anomalies and severe weather.</p>
            </div>
            
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:32px; padding:32px; margin-bottom:32px; backdrop-filter:blur(20px);">
                <label style="display:flex; align-items:center; justify-content:space-between; padding-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:20px;">
                    <span style="font-size:1.15rem; color:white; font-weight:600;">River Anomalies</span>
                    <input type="checkbox" id="pref-river-alerts" checked style="width:28px; height:28px; accent-color:#34d399; cursor:pointer;">
                </label>
                <label style="display:flex; align-items:center; justify-content:space-between; padding-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:20px;">
                    <span style="font-size:1.15rem; color:white; font-weight:600;">AQI Degradation</span>
                    <input type="checkbox" id="pref-aqi-alerts" checked style="width:28px; height:28px; accent-color:#34d399; cursor:pointer;">
                </label>
                <label style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:1.15rem; color:white; font-weight:600;">Severe Weather</span>
                    <input type="checkbox" id="pref-weather-alerts" checked style="width:28px; height:28px; accent-color:#34d399; cursor:pointer;">
                </label>
            </div>
            
            <button id="btn-weather-push" onclick="toggleWeatherPush()" style="width:100%; background:white; color:black; border:none; padding:24px; border-radius:100px; font-size:1.3rem; font-weight:900; cursor:pointer; margin-bottom:24px; transition:transform 0.1s; display:flex; justify-content:center; align-items:center; gap:12px; box-shadow:0 10px 30px rgba(255,255,255,0.1);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                Initialize Uplink
            </button>
            <div id="weather-push-status" style="font-size:0.95rem; color:#34d399; text-align:center; font-family:'SF Mono', ui-monospace, monospace; text-transform:uppercase; font-weight:700; letter-spacing:1px;"></div>
        </div>
        
        <!-- 3x Click Admin Broadcast Trigger hidden at bottom -->
        <script>
        (function() {
            let clickCount = 0; let clickTimer = null;
            const attachTrigger = () => {
                const clockEl = document.getElementById('live-clock');
                if (clockEl) {
                    clockEl.addEventListener('click', () => {
                        clickCount++;
                        if (clickCount === 1) clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
                        if (clickCount >= 3) {
                            clearTimeout(clickTimer); clickCount = 0;
                            if (typeof sendAdminBroadcast === 'function') sendAdminBroadcast();
                        }
                    });
                } else setTimeout(attachTrigger, 500);
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachTrigger);
            else attachTrigger();
        })();
        </script>
    </div>
</section>
"""

    content = content.replace(old_section, new_section)
    
    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    refine_telemetry()
    print("Telemetry Swipe Deck CSS refined.")
