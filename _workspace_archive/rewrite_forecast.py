import re

def insert_forecast_card():
    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the weather-forecast-track from Atmospherics card
    old_atmospherics_forecast = """<div style="background:rgba(0,0,0,0.3); border-radius:24px; padding:24px; border:1px solid rgba(255,255,255,0.05);">
                <h3 style="font-size:0.9rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:1px; margin-top:0; margin-bottom:16px;">5-Day Forecast</h3>
                <div id="weather-forecast-track" style="display:flex; gap:16px; overflow-x:auto; padding-bottom:8px; -webkit-overflow-scrolling:touch;"></div>
            </div>"""
    content = content.replace(old_atmospherics_forecast, "")

    # 2. Define the new dedicated Forecast Card
    new_forecast_card = """
    <!-- CARD 1.5: FORECAST -->
    <div class="swipe-card" style="height:100%; width:100%; scroll-snap-align: start; scroll-snap-stop: always; background:radial-gradient(circle at top, #0f172a 0%, #000000 100%); display:flex; flex-direction:column; justify-content:center; padding:24px; position:relative;">
        <div style="max-width:500px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:24px;">
            <div style="display:flex; align-items:center; gap:16px;">
                <div style="width:56px; height:56px; background:linear-gradient(135deg, #0284c7, #2563eb); border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(2,132,199,0.3);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"></path></svg>
                </div>
                <div>
                    <h2 style="font-size:2.2rem; font-weight:900; color:white; margin:0; letter-spacing:-0.5px;">Forecast</h2>
                    <div style="color:#94a3b8; font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">5-Day Outlook</div>
                </div>
            </div>
            
            <div id="weather-forecast-track" style="display:flex; gap:16px; overflow-x:auto; padding-bottom:16px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling:touch; width: 100vw; margin-left: -24px; padding-left: 24px; padding-right: 24px; box-sizing: border-box;"></div>
        </div>
    </div>
    """

    # Insert it right after the Radar Card
    # Look for the end of the Radar Card:
    radar_end_marker = "<!-- CARD 2: HYDROLOGY -->"
    content = content.replace(radar_end_marker, new_forecast_card + "\n    " + radar_end_marker)

    # 3. Rewrite the JS that generates the forecast HTML
    js_pattern = r'return `\s*<div class="dashboard-panel weather-card".*?</div>`;'
    
    new_js_html = """return `
            <div style="scroll-snap-align: center; min-width: 160px; flex: 0 0 auto; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:20px; display:flex; flex-direction:column; backdrop-filter:blur(20px);">
                <div style="font-size:1.1rem; font-weight:800; color:#38bdf8; margin-bottom:12px;">${escapeHtml(dayKey)}</div>
                
                <div style="background:rgba(0,0,0,0.3); border-radius:12px; padding:8px 12px; display:inline-block; margin-bottom:16px; align-self:flex-start;">
                    <span style="font-size:0.8rem; font-weight:700; color:white;">${escapeHtml(statusText)}</span>
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
                        <div style="color:#94a3b8; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Gusts</div>
                        <div style="color:#e2e8f0; font-size:1.1rem; font-weight:600;">${Math.round(maxWind)} mph</div>
                    </div>
                </div>
            </div>`;"""

    content = re.sub(js_pattern, new_js_html, content, flags=re.DOTALL)

    with open('c:/Users/John/Desktop/dondlingergc.com/index.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    insert_forecast_card()
    print("Forecast Card inserted and JS rewritten.")
