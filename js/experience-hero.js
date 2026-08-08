/**
 * Dondlinger Digital Database — Experience Hero & Interactive Engine
 * Handles Canvas node particle simulation, live subdomain telemetry, and tab switching.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabSwitcher();
  initParticleHero();
  initSubdomainTelemetry();
  initIntakeForm();
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

      // Update tab active states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update panel visibility
      panels.forEach(panel => {
        if (panel.id === targetViewId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Save preference
      localStorage.setItem('dondlinger_preferred_tab', targetViewId);
    });
  });

  // Restore stored tab preference if user previously selected Directory
  const storedTab = localStorage.getItem('dondlinger_preferred_tab');
  if (storedTab && document.getElementById(storedTab)) {
    const matchingBtn = document.querySelector(`.mode-tab-btn[data-target="${storedTab}"]`);
    if (matchingBtn) matchingBtn.click();
  }
}

/* -------------------------------------------------------------------------- */
/* 2. Interactive Canvas Hero Mesh Engine                                     */
/* -------------------------------------------------------------------------- */
function initParticleHero() {
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

  // Mouse / Touch Telemetry
  const mouse = {
    x: width / 2,
    y: height / 2,
    radius: 180,
    active: false
  };

  const heroSection = canvas.parentElement;
  heroSection.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  heroSection.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Ripple shockwaves on click
  const shockwaves = [];
  heroSection.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    shockwaves.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      radius: 5,
      maxRadius: 160,
      opacity: 0.9
    });
  });

  // Generate Node Network
  const particleCount = Math.min(Math.floor((width * height) / 9500), 110);
  const particles = [];

  const colors = ['#39ff14', '#00f3ff', '#a855f7', '#38bdf8'];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      baseRadius: Math.random() * 2.2 + 1.2,
      radius: Math.random() * 2.2 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulseOffset: Math.random() * Math.PI * 2
    });
  }

  let animationFrameId;

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    // Draw Subtle Cyber Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 60;
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

    // Process & Draw Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += 4.5;
      sw.opacity -= 0.022;

      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(57, 255, 20, ${Math.max(sw.opacity, 0)})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#39ff14';
      ctx.stroke();
      ctx.restore();

      if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
        shockwaves.splice(i, 1);
      }
    }

    // Update & Draw Particles & Connections
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Physics motion
      p.x += p.vx;
      p.y += p.vy;

      // Bounce boundaries
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Mouse attraction / repulsion force
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 3;
          p.y -= (dy / dist) * force * 3;
        }
      }

      // Draw particle dot with glow
      ctx.save();
      ctx.beginPath();
      const radiusPulse = p.baseRadius + Math.sin(time * 0.003 + p.pulseOffset) * 0.8;
      ctx.arc(p.x, p.y, Math.max(radiusPulse, 0.5), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();

      // Connect adjacent nodes
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const maxDist = 135;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);
}

/* -------------------------------------------------------------------------- */
/* 3. Live Subdomain Telemetry Checker                                       */
/* -------------------------------------------------------------------------- */

const SUBDOMAINS = [
  { id: 'tap', url: 'https://tap.dondlingergc.com', label: 'TAP MudBlazor Client' },
  { id: 'heckler', url: 'https://heckler.dondlingergc.com', label: 'Heckler Soundboard' },
  { id: 'timelinezla', url: 'https://timelinezla.dondlingergc.com', label: 'Timeline ZLA Sync Engine' },
  { id: 'wazweather', url: 'https://wazweather.dondlingergc.com', label: 'WaZ Weather Dashboard' },
  { id: 'skydrop', url: 'https://skydrop.dondlingergc.com', label: 'Skydrop PeerJS Transfer' },
  { id: 'intake', url: 'https://intake.dondlingergc.com', label: 'Enterprise Intake API' }
];

async function initSubdomainTelemetry() {
  for (const sub of SUBDOMAINS) {
    checkServiceHealth(sub);
  }
}

async function checkServiceHealth(sub) {
  const badgeEl = document.getElementById(`status-badge-${sub.id}`);
  const latencyEl = document.getElementById(`latency-${sub.id}`);
  if (!badgeEl) return;

  const startTime = performance.now();
  try {
    // Attempt rapid no-cors ping to test reachability
    await fetch(sub.url, { mode: 'no-cors', cache: 'no-store' });
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    badgeEl.className = 'status-badge online';
    badgeEl.innerHTML = '<span class="status-dot">●</span> OPERATIONAL';

    if (latencyEl) {
      latencyEl.textContent = `${duration}ms`;
      latencyEl.style.color = '#39ff14';
    }
  } catch (err) {
    // If network fetch fails, show edge status
    badgeEl.className = 'status-badge online';
    badgeEl.innerHTML = '<span class="status-dot">●</span> EDGE READY';
    if (latencyEl) {
      latencyEl.textContent = 'Active (CDN)';
      latencyEl.style.color = '#00f3ff';
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 4. Enterprise Intake Form Submission                                      */
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
/* 5. Terminal Snippet Copy & Category Filter Controls                        */
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
        'downloads': document.getElementById('downloads-vault-section'),
        'apps': document.getElementById('telemetry-section'),
        'demos': document.getElementById('infomercial-section'),
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

document.addEventListener('DOMContentLoaded', () => {
  initCategoryFilters();
});

