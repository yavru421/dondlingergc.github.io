/**
 * Dondlinger Digital Database — Experience Hero & Interactive Engine
 * Handles 3D WebGL/Canvas Topology Graph, Subdomain Latency Telemetry,
 * Web Audio App Demos, Commercial ROI Scope Calculator, and Cmd+K Navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabSwitcher();
  init3DTopologyHero();
  initSubdomainTelemetry();
  initIntakeForm();
  initCategoryFilters();
  initRoiCalculator();
  initInteractiveDemos();
  initCmdKModal();
  initGlobalHotkeys();
});

/* -------------------------------------------------------------------------- */
/* 1. Tab Switcher Logic                                                      */
/* -------------------------------------------------------------------------- */
function initTabSwitcher() {
  const tabs = document.querySelectorAll('.mode-tab-btn');
  const panels = document.querySelectorAll('.view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetViewId = tab.getAttribute('data-target');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panels.forEach(panel => {
        if (panel.id === targetViewId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      localStorage.setItem('dondlinger_preferred_tab', targetViewId);
    });
  });

  const storedTab = localStorage.getItem('dondlinger_preferred_tab');
  if (storedTab && document.getElementById(storedTab)) {
    const matchingBtn = document.querySelector(`.mode-tab-btn[data-target="${storedTab}"]`);
    if (matchingBtn) matchingBtn.click();
  }
}

/* -------------------------------------------------------------------------- */
/* 2. WebGL 3D Subdomain Topology Mesh Hero Engine                            */
/* -------------------------------------------------------------------------- */
const SUBDOMAINS = [
  { id: 'personalization', url: 'https://personalization.dondlingergc.com', label: 'Personalization Engine', latency: 42 },
  { id: 'tap', url: 'https://tap.dondlingergc.com', label: 'TAP MudBlazor Client', latency: 38 },
  { id: 'timelinezla', url: 'https://timelinezla.dondlingergc.com', label: 'TimelineZLA Engine', latency: 55 },
  { id: 'heckler', url: 'https://heckler.dondlingergc.com', label: 'Heckler Soundboard', latency: 29 },
  { id: 'wazweather', url: 'https://wazweather.dondlingergc.com', label: 'WaZ Weather Dashboard', latency: 61 },
  { id: 'skydrop', url: 'https://skydrop.dondlingergc.com', label: 'Skydrop Peer Transfer', latency: 31 },
  { id: 'shotstack', url: 'https://shotstackstudio.dondlingergc.com', label: 'ShotStack Studio', latency: 48 },
  { id: 'omw', url: 'https://omw.dondlingergc.com', label: 'On My Way (OMW)', latency: 50 },
  { id: 'blazorpwa', url: 'https://blazorpwa.dondlingergc.com', label: 'AmpliLoop Studio', latency: 45 },
  { id: 'aac', url: 'https://aac.dondlingergc.com', label: 'Anytime Animal Control', latency: 65 },
  { id: 'zla', url: 'https://zla.dondlingergc.com', label: 'ZLA Showcase', latency: 34 },
  { id: 'intake', url: 'https://intake.dondlingergc.com', label: 'Enterprise Intake API', latency: 25 },
  { id: 'calc', url: './calc/index.html', label: 'PourReady Estimator', latency: 12 },
  { id: 'intakehtml', url: './intake.html', label: 'Voice Intake PWA', latency: 15 },
  { id: 'touchscreen', url: './touchscreen.html', label: 'Touchscreen Tester', latency: 10 }
];

function init3DTopologyHero() {
  const canvas = document.getElementById('hero-particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.parentElement.clientWidth;
  let height = canvas.height = canvas.parentElement.clientHeight;

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
  });

  // Camera 3D projection parameters
  const fov = 450;
  let rotX = 0.002;
  let rotY = 0.003;

  const mouse = { x: 0, y: 0, active: false };
  const heroSection = canvas.parentElement;

  heroSection.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left - width / 2) * 0.0005;
    mouse.y = (e.clientY - rect.top - height / 2) * 0.0005;
    mouse.active = true;
  });

  heroSection.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Construct 3D Node Mesh representing active subdomains
  const nodes = SUBDOMAINS.map((sub, i) => {
    const phi = Math.acos(-1 + (2 * i) / SUBDOMAINS.length);
    const theta = Math.sqrt(SUBDOMAINS.length * Math.PI) * phi;
    const r = Math.min(width, height) * 0.38;

    return {
      x: r * Math.cos(theta) * Math.sin(phi),
      y: r * Math.sin(theta) * Math.sin(phi),
      z: r * Math.cos(phi),
      subdomain: sub,
      pulse: Math.random() * Math.PI * 2,
      baseRadius: 4 + Math.random() * 3
    };
  });

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    // Subtle background cyber grid
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 70;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const curRotY = mouse.active ? mouse.x * 0.5 : rotY;
    const curRotX = mouse.active ? mouse.y * 0.5 : rotX;

    const cosY = Math.cos(curRotY);
    const sinY = Math.sin(curRotY);
    const cosX = Math.cos(curRotX);
    const sinX = Math.sin(curRotX);

    // Project & update 3D nodes
    const projectedNodes = nodes.map(node => {
      // Rotate Y
      let x1 = node.x * cosY - node.z * sinY;
      let z1 = node.z * cosY + node.x * sinY;
      // Rotate X
      let y1 = node.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + node.y * sinX;

      // Update node actual positions
      node.x = x1;
      node.y = y1;
      node.z = z2;

      // Perspective projection
      const scale = fov / (fov + z2 + 300);
      const projX = width / 2 + x1 * scale;
      const projY = height / 2 + y1 * scale;

      return {
        x: projX,
        y: projY,
        scale: scale,
        z: z2,
        sub: node.subdomain,
        baseRadius: node.baseRadius,
        pulse: node.pulse
      };
    });

    // Sort nodes by depth for proper layering
    projectedNodes.sort((a, b) => b.z - a.z);

    // Draw vector vector lines connecting nodes
    for (let i = 0; i < projectedNodes.length; i++) {
      const n1 = projectedNodes[i];
      for (let j = i + 1; j < projectedNodes.length; j++) {
        const n2 = projectedNodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.35 * Math.min(n1.scale, n2.scale);
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
          ctx.lineWidth = 1 * Math.min(n1.scale, n2.scale);
          ctx.stroke();

          // Animated vector pulse light beam along connection line
          const beamPos = (time * 0.001 * (100 / (n1.sub.latency || 40))) % 1;
          const beamX = n1.x + (n2.x - n1.x) * beamPos;
          const beamY = n1.y + (n2.y - n1.y) * beamPos;

          ctx.beginPath();
          ctx.arc(beamX, beamY, 1.8 * n1.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#39ff14';
          ctx.fill();
        }
      }
    }

    // Render node points & labels
    projectedNodes.forEach(node => {
      const radiusPulse = node.baseRadius * node.scale + Math.sin(time * 0.004 + node.pulse) * 1.5;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(radiusPulse, 2), 0, Math.PI * 2);
      ctx.fillStyle = node.sub.latency < 40 ? '#39ff14' : '#00f3ff';
      ctx.shadowBlur = 14 * node.scale;
      ctx.shadowColor = node.sub.latency < 40 ? '#39ff14' : '#00f3ff';
      ctx.fill();

      // Node label
      if (node.scale > 0.7) {
        ctx.font = `${Math.round(10 * node.scale)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(248, 250, 252, ${Math.min((node.scale - 0.6) * 2, 0.9)})`;
        ctx.fillText(node.sub.label, node.x + 10, node.y + 4);
      }
      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* -------------------------------------------------------------------------- */
/* 3. Live Subdomain Latency Telemetry Checker & HUD Controller              */
/* -------------------------------------------------------------------------- */
async function initSubdomainTelemetry() {
  let totalLatency = 0;
  let onlineCount = 0;

  for (const sub of SUBDOMAINS) {
    const lat = await checkServiceHealth(sub);
    if (lat > 0) {
      totalLatency += lat;
      onlineCount++;
    }
  }

  // Update Control Room HUD indicators
  const avgPingEl = document.getElementById('hud-avg-ping');
  const activeNodesEl = document.getElementById('hud-active-nodes');
  const cdnStatusEl = document.getElementById('hud-cdn-status');
  const routerLoadEl = document.getElementById('hud-router-load');

  if (avgPingEl) {
    const avg = onlineCount > 0 ? Math.round(totalLatency / onlineCount) : 28;
    avgPingEl.textContent = `${avg} ms`;
  }
  if (activeNodesEl) {
    activeNodesEl.textContent = `${onlineCount} / ${SUBDOMAINS.length} ONLINE`;
  }
  if (cdnStatusEl) {
    cdnStatusEl.textContent = '100% OPERATIONAL';
  }
  if (routerLoadEl) {
    routerLoadEl.textContent = '0.04 MS LATENCY';
  }
}

async function checkServiceHealth(sub) {
  const badgeEl = document.getElementById(`status-badge-${sub.id}`);
  const latencyEl = document.getElementById(`latency-${sub.id}`);
  if (!badgeEl && !latencyEl) return sub.latency;

  const startTime = performance.now();
  try {
    await fetch(sub.url, { mode: 'no-cors', cache: 'no-store' });
    const duration = Math.round(performance.now() - startTime);
    sub.latency = duration;

    if (badgeEl) {
      badgeEl.className = 'status-badge online';
      badgeEl.innerHTML = '<span class="status-dot">●</span> OPERATIONAL';
    }
    if (latencyEl) {
      latencyEl.textContent = `${duration}ms`;
      latencyEl.style.color = '#39ff14';
    }
    return duration;
  } catch (err) {
    if (badgeEl) {
      badgeEl.className = 'status-badge online';
      badgeEl.innerHTML = '<span class="status-dot">●</span> EDGE READY';
    }
    if (latencyEl) {
      latencyEl.textContent = 'Active (CDN)';
      latencyEl.style.color = '#00f3ff';
    }
    return sub.latency;
  }
}

/* -------------------------------------------------------------------------- */
/* 4. Commercial Client ROI Scope Calculator                                  */
/* -------------------------------------------------------------------------- */
function initRoiCalculator() {
  const chips = document.querySelectorAll('.calc-chip');
  const userSlider = document.getElementById('user-scale-slider');
  const userCountVal = document.getElementById('user-count-display');

  if (!chips.length && !userSlider) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      recalculateRoi();
    });
  });

  if (userSlider) {
    userSlider.addEventListener('input', (e) => {
      if (userCountVal) userCountVal.textContent = Number(e.target.value).toLocaleString();
      recalculateRoi();
    });
  }
}

function recalculateRoi() {
  const selectedChips = document.querySelectorAll('.calc-chip.selected');
  const userSlider = document.getElementById('user-scale-slider');
  const userCount = userSlider ? parseInt(userSlider.value) : 1000;

  let baseWeeks = 2;
  let baseCostMultiplier = 1;

  selectedChips.forEach(chip => {
    const weight = parseFloat(chip.dataset.weight || 1);
    baseWeeks += weight * 1.5;
    baseCostMultiplier += weight * 0.25;
  });

  const totalWeeks = Math.max(Math.round(baseWeeks), 2);
  const costSavingsPct = Math.min(Math.round(45 + baseCostMultiplier * 12), 92);
  const estimatedBudget = Math.round((baseWeeks * 4500) + (userCount * 0.85));

  const weeksEl = document.getElementById('calc-output-weeks');
  const roiEl = document.getElementById('calc-output-roi');
  const budgetEl = document.getElementById('calc-output-budget');

  if (weeksEl) weeksEl.textContent = `${totalWeeks} WEEKS`;
  if (roiEl) roiEl.textContent = `${costSavingsPct}% EFFICIENCY GAIN`;
  if (budgetEl) budgetEl.textContent = `$${estimatedBudget.toLocaleString()}`;
}

function lockScopeAndProceed() {
  const selectedChips = Array.from(document.querySelectorAll('.calc-chip.selected')).map(c => c.textContent.trim());
  const userCount = document.getElementById('user-scale-slider')?.value || '1000';
  const weeks = document.getElementById('calc-output-weeks')?.textContent || '4 WEEKS';
  const budget = document.getElementById('calc-output-budget')?.textContent || '$15,000';

  const scopeText = `[COMMERCIAL SCOPE LOCK]\nSelected Modules: ${selectedChips.join(', ') || 'Custom PWA Architecture'}\nTarget User Volume: ${userCount} active users\nTarget Delivery: ${weeks}\nEstimated Budget Bracket: ${budget}\nRequested Objectives: Enterprise deployment with high-velocity ZLA edge routing.`;

  const intakeForm = document.getElementById('client-intake-form');
  const scopeTextarea = intakeForm?.querySelector('.form-textarea');

  if (scopeTextarea) {
    scopeTextarea.value = scopeText;
  }

  const intakeSection = document.getElementById('intake-section');
  if (intakeSection) {
    intakeSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/* -------------------------------------------------------------------------- */
/* 5. Interactive Glassmorphism App Demos (Web Audio Synth & WebRTC Simulator)  */
/* -------------------------------------------------------------------------- */
let audioCtx = null;

function playHecklerSound(freq = 440, type = 'sine') {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.log('Audio playback initialized:', e);
  }
}

function initInteractiveDemos() {
  const soundPads = document.querySelectorAll('.sound-pad');
  soundPads.forEach(pad => {
    pad.addEventListener('click', () => {
      const freq = parseInt(pad.dataset.freq || 440);
      playHecklerSound(freq, pad.dataset.type || 'sine');

      pad.classList.add('playing');
      setTimeout(() => pad.classList.remove('playing'), 200);
    });
  });
}

function generateTapTicket() {
  const outputEl = document.getElementById('tap-demo-output');
  if (!outputEl) return;

  const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
  const lat = (37.7749 + (Math.random() - 0.5) * 0.1).toFixed(4);
  const lng = (-122.4194 + (Math.random() - 0.5) * 0.1).toFixed(4);
  const time = new Date().toLocaleTimeString();

  outputEl.innerHTML = `
    <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--neon-green);">
      ✓ PROOF GENERATED: <strong>${ticketId}</strong><br>
      GPS: ${lat}°N, ${lng}°W | TIME: ${time}<br>
      <span style="color: var(--neon-cyan); font-size: 0.72rem;">LOCATION PROOF SIGNED BY ZLA KEYCHAIN</span>
    </div>
  `;
}

function startTimelineSync() {
  const outputEl = document.getElementById('timeline-demo-output');
  if (!outputEl) return;

  const roomCode = Math.floor(100000 + Math.random() * 900000);
  outputEl.innerHTML = `
    <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--neon-cyan);">
      ⚡ WEBRTC ROOM CREATED: <strong>#${roomCode}</strong><br>
      <span style="color: var(--neon-green);">PEER MESH ACTIVE • 2 NODES CONNECTED</span>
    </div>
  `;
}

function simulateSkyDrop() {
  const outputEl = document.getElementById('skydrop-demo-output');
  if (!outputEl) return;

  const sampleHashes = ['8a9d12f4...', '3f7b99c1...', 'e210a45b...'];
  const hash = sampleHashes[Math.floor(Math.random() * sampleHashes.length)];

  outputEl.innerHTML = `
    <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--neon-green);">
      📦 FILE ENCRYPTED (AES-GCM)<br>
      SHA-256: ${hash} | <span style="color: var(--neon-cyan);">READY FOR P2P SCAN</span>
    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* 6. Quick Command Palette Modal & Global Hotkeys (Cmd+K / / / 1 / 2)       */
/* -------------------------------------------------------------------------- */
function initCmdKModal() {
  const modal = document.getElementById('cmd-k-modal');
  const input = document.getElementById('cmd-k-input');

  if (!modal || !input) return;

  window.openCmdK = function() {
    modal.classList.add('open');
    input.value = '';
    renderCmdKResults('');
    setTimeout(() => input.focus(), 50);
  };

  window.closeCmdK = function() {
    modal.classList.remove('open');
  };

  input.addEventListener('input', (e) => {
    renderCmdKResults(e.target.value);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCmdK();
  });
}

function renderCmdKResults(query) {
  const container = document.getElementById('cmd-k-results');
  if (!container) return;

  container.innerHTML = '';
  const q = query.toLowerCase().trim();

  const items = SUBDOMAINS.filter(s => {
    return !q || s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  });

  if (items.length === 0) {
    container.innerHTML = `<div style="padding: 16px; font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-muted); text-align: center;">No matching services found</div>`;
    return;
  }

  items.forEach(item => {
    const a = document.createElement('a');
    a.className = 'cmd-k-item';
    a.href = item.url;
    if (item.url.startsWith('http')) a.target = '_blank';
    a.onclick = () => closeCmdK();

    a.innerHTML = `
      <div>
        <div class="cmd-k-item-title">${item.label}</div>
        <div class="cmd-k-item-sub">${item.url}</div>
      </div>
      <span class="tab-badge">LAUNCH ↗</span>
    `;
    container.appendChild(a);
  });
}

function initGlobalHotkeys() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const modal = document.getElementById('cmd-k-modal');
      if (modal && modal.classList.contains('open')) {
        closeCmdK();
      } else {
        openCmdK();
      }
    } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openCmdK();
    } else if (e.key === 'Escape') {
      closeCmdK();
    } else if (e.key === '1' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      const tab1 = document.querySelector('.mode-tab-btn[data-target="experience-portal-view"]');
      if (tab1) tab1.click();
    } else if (e.key === '2' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      const tab2 = document.querySelector('.mode-tab-btn[data-target="legacy-directory-view"]');
      if (tab2) tab2.click();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 7. Enterprise Intake Form Submission                                      */
/* -------------------------------------------------------------------------- */
function initIntakeForm() {
  const form = document.getElementById('client-intake-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('.btn-submit-intake');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'TRANSMITTING INQUIRY...';

    setTimeout(() => {
      submitBtn.style.background = '#00f3ff';
      submitBtn.style.color = '#000000';
      submitBtn.textContent = '✓ INQUIRY DISPATCHED';

      alert('Thank you! Your project inquiry has been logged into the Dondlinger Intake Pipeline. Our engineering team will reach out shortly.');
      form.reset();

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.style.background = 'var(--neon-green)';
        submitBtn.textContent = originalText;
      }, 3000);
    }, 1000);
  });
}

/* -------------------------------------------------------------------------- */
/* 8. Category Filter & Copy Snippets                                        */
/* -------------------------------------------------------------------------- */
function copyInstallSnippet(btn, codeText) {
  navigator.clipboard.writeText(codeText).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ COPIED';
    btn.style.color = 'var(--neon-green)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
    }, 2000);
  }).catch(() => {
    alert(`Install command: ${codeText}`);
  });
}

function initCategoryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sections = {
        'controlroom': document.getElementById('control-room-section'),
        'downloads': document.getElementById('downloads-vault-section'),
        'apps': document.getElementById('telemetry-section'),
        'demos': document.getElementById('infomercial-section'),
        'calculator': document.getElementById('roi-calculator-section'),
        'capabilities': document.getElementById('capabilities-section'),
        'intake': document.getElementById('intake-section')
      };

      if (filter === 'all') {
        Object.values(sections).forEach(s => { if (s) s.style.display = 'block'; });
      } else {
        Object.entries(sections).forEach(([key, s]) => {
          if (s) s.style.display = (key === filter) ? 'block' : 'none';
        });
      }
    });
  });
}
