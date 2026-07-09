import re

def rewrite_telemetry():
    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the #wazeecha-telemetry section
    pattern = r'(<section id="wazeecha-telemetry".*?)(<!-- App Grid Section -->)'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("Could not find telemetry section!")
        return
        
    old_section = match.group(1)
    
    # New swipe deck layout
    new_section = """<section id="wazeecha-telemetry" class="telemetry-section content-section" style="width: 100vw; height: 100dvh; position: fixed; inset: 0; z-index: 9999; background: #000; margin: 0; padding: 0; overflow-y: scroll; scroll-snap-type: y mandatory; overflow-x: hidden; -webkit-overflow-scrolling: touch; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <!-- FLOATING UI -->
    <div style="position:fixed; top:20px; left:20px; z-index:10000; display:flex; flex-direction:column;">
        <span style="color:#10b981; font-weight:800; text-transform:uppercase; letter-spacing:1px; text-shadow:0 2px 4px rgba(0,0,0,0.5); font-size:0.8rem;">Live Data</span>
        <div id="live-clock" style="color:white; font-family:monospace; font-size:1.2rem; font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.8);">00:00:00</div>
    </div>
    
    <button onclick="resetActiveGateway()" style="position:fixed; top:20px; right:20px; z-index:10000; background:rgba(255,255,255,0.15); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.3); color:white; padding:10px 16px; border-radius:30px; font-weight:700; display:flex; align-items:center; gap:6px; cursor:pointer;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Hub
    </button>
    
    <!-- Swipe Indicator -->
    <div style="position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:10000; color:rgba(255,255,255,0.6); display:flex; flex-direction:column; align-items:center; animation: bounce 2s infinite; pointer-events:none;">
        <span style="font-size:0.8rem; text-transform:uppercase; letter-spacing:2px; font-weight:600;">Swipe Up</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
    </div>
    <style>@keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);} 40% {transform: translateY(-10px) translateX(-50%);} 60% {transform: translateY(-5px) translateX(-50%);} }</style>

    <!-- CARD 1: THE RADAR HERO -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; position: relative;">
        <!-- Full Bleed Map Background -->
        <iframe src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=9&overlay=radar&product=radar&level=surface&lat=44.31&lon=-89.83" style="width:100%; height:100%; border:none; pointer-events:auto; position:absolute; inset:0;"></iframe>
        
        <!-- Gradient Overlay for Readability -->
        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%); pointer-events:none;"></div>
        
        <!-- Bottom Info Block -->
        <div style="position:absolute; bottom:100px; left:20px; right:20px; color:white; pointer-events:none;">
            <div style="background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#10b981; display:inline-block; padding:4px 12px; border-radius:20px; font-weight:700; font-size:0.8rem; margin-bottom:12px; backdrop-filter:blur(4px);">STATUS: OPTIMAL</div>
            <h1 style="font-size:2.5rem; font-weight:900; margin:0 0 4px 0; line-height:1.1; text-shadow:0 2px 10px rgba(0,0,0,0.8);">Live Storm Radar</h1>
            <p style="font-size:1.1rem; color:rgba(255,255,255,0.8); margin:0; text-shadow:0 1px 4px rgba(0,0,0,0.8);">Wazeecha Operational Zone</p>
        </div>
    </div>

    <!-- CARD 2: HYDROLOGY -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; background:#0f172a; display:flex; flex-direction:column; justify-content:center; padding:20px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                <div style="width:48px; height:48px; background:rgba(59,130,246,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <h2 style="font-size:2rem; font-weight:800; color:white; margin:0;">Hydrology</h2>
            </div>
            
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:24px; backdrop-filter:blur(10px); margin-bottom:24px;">
                <div style="margin-bottom:24px;">
                    <div style="color:#94a3b8; font-size:1rem; font-weight:600; margin-bottom:4px;">Water Flow</div>
                    <div id="metric-cfs" style="color:#60a5fa; font-size:3rem; font-weight:900; line-height:1;">-- CFS</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div>
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:4px;">River Depth</div>
                        <div id="metric-gauge" style="color:#a78bfa; font-size:2rem; font-weight:800; line-height:1;">-- ft</div>
                    </div>
                    <div>
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:4px;">Velocity</div>
                        <div id="metric-vel" style="color:#34d399; font-size:2rem; font-weight:800; line-height:1;">-- ft/s</div>
                    </div>
                </div>
            </div>
            
            <div style="height:200px; width:100%;">
                <canvas id="hydroChart" style="width:100%; height:100%;"></canvas>
            </div>
        </div>
    </div>

    <!-- CARD 3: ATMOSPHERICS -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; background:#1e1b4b; display:flex; flex-direction:column; justify-content:center; padding:20px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:48px; height:48px; background:rgba(245,158,11,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <h2 style="font-size:2rem; font-weight:800; color:white; margin:0;">Atmospherics</h2>
                </div>
                <div id="detail-aqi-status" style="font-weight:700; font-size:0.8rem; background:rgba(255,255,255,0.1); padding:6px 12px; border-radius:20px; color:white;">STATUS: --</div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
                <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:24px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                    <div style="color:#94a3b8; font-size:1rem; font-weight:600; margin-bottom:4px;">US AQI</div>
                    <div id="metric-aqi" style="font-size:3.5rem; font-weight:900; line-height:1; color:white;">--</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:16px; flex:1; display:flex; flex-direction:column; justify-content:center;">
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:4px;">Dust Density</div>
                        <div id="metric-dust" style="color:#cbd5e1; font-size:1.5rem; font-weight:800; line-height:1;">--</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:16px; flex:1; display:flex; flex-direction:column; justify-content:center;">
                        <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; margin-bottom:4px;">UV Index</div>
                        <div id="metric-uv" style="color:#fbbf24; font-size:1.5rem; font-weight:800; line-height:1;">--</div>
                    </div>
                </div>
            </div>
            
            <div style="background:rgba(0,0,0,0.3); border-radius:24px; padding:20px;">
                <h3 style="font-size:0.9rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-top:0; margin-bottom:12px;">5-Day Forecast</h3>
                <div id="weather-forecast-track" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px; -webkit-overflow-scrolling:touch;"></div>
            </div>
            
            <!-- Hidden elements to keep JS happy -->
            <div id="pollutant-bars" style="display:none;"></div>
            <div id="wazeecha-index-score" style="display:none;"></div>
            <div id="wazeecha-index-status" style="display:none;"></div>
        </div>
    </div>

    <!-- CARD 4: PUSH TERMINAL -->
    <div class="swipe-card" style="height:100dvh; width:100vw; scroll-snap-align: start; scroll-snap-stop: always; background:#000; display:flex; flex-direction:column; justify-content:center; padding:20px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto;">
            <div style="text-align:center; margin-bottom:40px;">
                <div style="display:inline-flex; width:64px; height:64px; background:rgba(255,255,255,0.1); border-radius:32px; align-items:center; justify-content:center; margin-bottom:20px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </div>
                <h2 style="font-size:2.5rem; font-weight:900; color:white; margin:0 0 12px 0; line-height:1.1;">Push Secure<br>Alerts</h2>
                <p style="font-size:1rem; color:#94a3b8; margin:0;">Subscribe to encrypted push notifications for critical river level anomalies and severe atmospheric shifts.</p>
            </div>
            
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:24px; margin-bottom:24px;">
                <label style="display:flex; align-items:center; justify-content:space-between; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:16px;">
                    <span style="font-size:1.1rem; color:white; font-weight:600;">Hydrology Anomalies</span>
                    <input type="checkbox" id="pref-river-alerts" checked style="width:24px; height:24px; accent-color:#39ff14;">
                </label>
                <label style="display:flex; align-items:center; justify-content:space-between; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:16px;">
                    <span style="font-size:1.1rem; color:white; font-weight:600;">Air Quality Degradation</span>
                    <input type="checkbox" id="pref-aqi-alerts" checked style="width:24px; height:24px; accent-color:#39ff14;">
                </label>
                <label style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:1.1rem; color:white; font-weight:600;">Severe Weather</span>
                    <input type="checkbox" id="pref-weather-alerts" checked style="width:24px; height:24px; accent-color:#39ff14;">
                </label>
            </div>
            
            <button id="btn-weather-push" onclick="toggleWeatherPush()" style="width:100%; background:white; color:black; border:none; padding:20px; border-radius:100px; font-size:1.2rem; font-weight:800; cursor:pointer; margin-bottom:16px;">
                Initialize Uplink
            </button>
            <div id="weather-push-status" style="font-size:0.9rem; color:#39ff14; text-align:center; font-family:monospace; text-transform:uppercase; font-weight:700;"></div>
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
    rewrite_telemetry()
    print("Telemetry Swipe Deck rewrite complete.")
