.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
    .dashboard-panel { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .chart-box { position: relative; width: 100%; height: 250px; }
    .radar-box { position: relative; width: 100%; height: 300px; display: flex; justify-content: center; }
    @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }

    /* App details database */
    const APP_DATA = {
      greeting: {
        title: 'Dondlinger Digital // 00',
        accent: 'var(--accent-info)',
        screenshot: '',
        desc: 'A curated engineering catalog of field-tested progressive web applications. Each tool is purpose-built, ruthlessly scoped, and deployed for performance at the edge. No bloat. No guesswork. Just precision engineering.',
        who: ['Engineers', 'Developers', 'Product Designers'],
        link: '#',
        btnLabel: 'Catalog Info Active'
      },
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

    /* Live Telemetry Data Fetch */
    async function fetchTelemetry() {
      // 1. Fetch USGS Hydrology (Flow, Gauge, Velocity for 7 Days)
      try {
        const hydroRes = await fetch('https://waterservices.usgs.gov/nwis/iv/?format=json&sites=05400760&parameterCd=00060,00065,72254&period=P7D');
        const hydroData = await hydroRes.json();
        
        let cfsData=[], gaugeData=[], labels=[];
        hydroData.value.timeSeries.forEach(series => {
          const code = series.variable.variableCode[0].value;
          const vals = series.values[0].value;
          if (!vals || vals.length === 0) return;
          
          const currentVal = vals[vals.length - 1].value;
          
          if (code === '00060') {
            document.getElementById('metric-cfs').textContent = `${parseFloat(currentVal).toLocaleString()} CFS`;
            const step = Math.max(1, Math.floor(vals.length / 40));
            for(let i=0; i<vals.length; i+=step) {
              cfsData.push(parseFloat(vals[i].value));
              const d = new Date(vals[i].dateTime);
              labels.push(d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }));
            }
          } else if (code === '00065') {
            document.getElementById('metric-gauge').textContent = `${parseFloat(currentVal).toFixed(2)} ft`;
            const step = Math.max(1, Math.floor(vals.length / 40));
            for(let i=0; i<vals.length; i+=step) gaugeData.push(parseFloat(vals[i].value));
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
              { label: 'Flow (CFS)', data: cfsData, borderColor: '#00e5ff', backgroundColor: 'rgba(0, 229, 255, 0.1)', yAxisID: 'y', fill: true, tension: 0.4, pointRadius: 0 },
              { label: 'Gauge (ft)', data: gaugeData, borderColor: '#a78bfa', yAxisID: 'y1', borderDash: [5, 5], tension: 0.4, pointRadius: 0 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#6B7280', maxTicksLimit: 7 } },
              y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#00e5ff' } },
              y1: { type: 'linear', display: true, position: 'right', grid: { display: false }, ticks: { color: '#a78bfa' } }
            },
            plugins: { legend: { labels: { color: '#9CA3AF' } } }
          }
        });
      } catch (err) { console.error(err); }

      // 2. Fetch Open-Meteo AQI
      try {
        const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=44.3936&longitude=-89.8173&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index');
        const aqiData = await aqiRes.json();
        const c = aqiData.current;
        
        document.getElementById('metric-aqi').textContent = c.us_aqi || 20;
        document.getElementById('metric-dust').textContent = `${c.dust || 0} μg/m³`;
        document.getElementById('metric-uv').textContent = c.uv_index || 0;
        
        let status = 'Excellent', statusColor = 'var(--accent-tap)';
        if (c.us_aqi > 50) { status = 'Moderate'; statusColor = 'var(--accent-pour)'; }
        if (c.us_aqi > 100) { status = 'Unhealthy'; statusColor = '#EF4444'; }
        
        const statusEl = document.getElementById('detail-aqi-status');
        statusEl.textContent = `Status: ${status}`; statusEl.style.color = statusColor;
        document.getElementById('metric-aqi').style.color = statusColor;

        // AQI Radar Chart
        if (window.aqiRadarInst) window.aqiRadarInst.destroy();
        window.aqiRadarInst = new Chart(document.getElementById('aqiRadarChart').getContext('2d'), {
          type: 'radar',
          data: {
            labels: ['PM10', 'PM2.5', 'Ozone', 'NO2', 'SO2', 'CO'],
            datasets: [{
              label: 'Concentration (μg/m³)',
              data: [c.pm10||0, c.pm2_5||0, c.ozone||0, c.nitrogen_dioxide||0, c.sulphur_dioxide||0, c.carbon_monoxide||0],
              backgroundColor: 'rgba(0, 255, 136, 0.2)', borderColor: '#00ff88', pointBackgroundColor: '#00ff88', borderWidth: 2
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#9CA3AF' }, ticks: { display: false } } },
            plugins: { legend: { display: false } }
          }
        });
      } catch (err) { console.error(err); }

      // 3. Fetch Open-Meteo Weather Forecast
      try {
        const wxRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.3936&longitude=-89.8173&hourly=temperature_2m,precipitation,wind_gusts_10m&forecast_days=3&timezone=America%2FChicago');
        const wxData = await wxRes.json();
        
        const h = wxData.hourly;
        const labels = h.time.map(t => new Date(t).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }));
        
        if (window.wxChartInst) window.wxChartInst.destroy();
        window.wxChartInst = new Chart(document.getElementById('weatherChart').getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              { type: 'line', label: 'Wind Gusts (mph)', data: h.wind_gusts_10m, borderColor: '#ff9900', tension: 0.4, yAxisID: 'y', pointRadius: 0 },
              { type: 'line', label: 'Temp (°F)', data: h.temperature_2m, borderColor: '#EF4444', borderDash: [5,5], tension: 0.4, yAxisID: 'y', pointRadius: 0 },
              { type: 'bar', label: 'Precipitation (in)', data: h.precipitation, backgroundColor: 'rgba(0, 229, 255, 0.5)', yAxisID: 'y1' }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#6B7280', maxTicksLimit: 12 } },
              y: { display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ff9900' } },
              y1: { display: true, position: 'right', grid: { display: false }, ticks: { color: '#00e5ff' } }
            },
            plugins: { legend: { labels: { color: '#9CA3AF' } } }
          }
        });
      } catch(err) { console.error(err); }
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
        
        // Trigger pollen animation fills
        
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
      
      overlay.classList.add('open');
    }

    function closeDialog() {
      overlay.classList.remove('open');
      // Reset animations
      document.getElementById('fill-pm10').style.width = '0%';
      document.getElementById('fill-pm25').style.width = '0%';
      document.getElementById('fill-uv').style.width = '0%';
    }

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const appKey = card.dataset.app;
        if(appKey === 'sentinel') return;
        openDialog(appKey);
      });
    });

    closeBtn.addEventListener('click', closeDialog);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });
    
    launchBtn.addEventListener('click', e => {
      if (launchBtn.textContent === 'Close HUD' || key === 'greeting') {
        e.preventDefault();
        closeDialog();
      }
    });

    // Init Page Details
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    fetchTelemetry();
  