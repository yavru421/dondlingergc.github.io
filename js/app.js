// ==========================================================================
// DONDLINGER GENERAL CONTRACTING — 3-GATEWAY DECISION TREE ENGINE
// ==========================================================================

let appData = null;
let currentView = 'root'; // 'root' | 'work' | 'trade' | 'estimations' | 'contact'
let selectedTradeId = null;
let currentSliderTrade = 'concrete';
let selectedPhotos = [];
const slideIndices = {}; // projectId -> currentSlideIndex

// Trade Ballpark Configurations for Estimator
const ESTIMATE_CONFIGS = {
  concrete: {
    tag: '4,000 PSI Concrete Flatwork',
    unit: 'Sq Ft',
    min: 150, max: 2500, step: 25, defaultVal: 450,
    rateMin: 9.00, rateMax: 14.50,
    notes: [
      '4,000 PSI Badgerland ready-mix with 6% air-entrainment',
      '4" compacted dense-graded granular base (DGB)',
      'Epoxied #4 rebar pinning into foundation & diamond saw-cut joints',
      'Site excavation, forming, and non-slip brushed broom finish'
    ]
  },
  decks: {
    tag: 'Custom Decks & Heavy Stairs',
    unit: 'Sq Ft',
    min: 100, max: 800, step: 20, defaultVal: 240,
    rateMin: 38.00, rateMax: 75.00,
    notes: [
      '48" below-frost concrete footings with galvanized Simpson anchors',
      'Treated 2x10 joists on heavy 6x6 post carrying beams',
      'Trex / TimberTech composite decking with hidden clip fasteners',
      'Rigid code-compliant railings and custom 2x12 stair stringers'
    ]
  },
  framing: {
    tag: 'Additions & Garages Shell Framing',
    unit: 'Sq Ft',
    min: 200, max: 1500, step: 50, defaultVal: 400,
    rateMin: 180.00, rateMax: 290.00,
    notes: [
      'Wisconsin SPS 321 Uniform Dwelling Code structural compliance',
      'LP WeatherLogic air and water barrier sheathing with taped seams',
      'Engineered LVL floor carrying beams and window/door headers',
      'Factory-engineered roof truss system with hurricane ties'
    ]
  },
  roofing: {
    tag: 'Steep-Slope Shingle Tear-Off & Reshingle',
    unit: 'Squares (100 Sq Ft)',
    min: 8, max: 40, step: 1, defaultVal: 15,
    rateMin: 450.00, rateMax: 650.00,
    notes: [
      'Complete tear-off down to sound decking with nail inspection',
      'Owens Corning Duration SureNail architectural shingles',
      'Self-adhering ice & water shield at eaves, valleys, and sidewalls',
      'High-performance synthetic underlayment & new drip edge'
    ]
  },
  remodels: {
    tag: 'Kitchen & Bath Overhauls',
    unit: 'Project Scale',
    min: 1, max: 4, step: 1, defaultVal: 1,
    customLabels: { 1: 'Half Bath / Vanity', 2: 'Full Bath Overhaul', 3: 'Master Suite', 4: 'Kitchen Remodel' },
    customRanges: { 1: '$1,800 – $3,500', 2: '$6,500 – $12,000', 3: '$12,000 – $22,000', 4: '$18,000 – $35,000' },
    notes: [
      'In-wall plumbing relocation, GFCI electrical, and subfloor prep',
      'Moisture-resistant Sheetrock with 3-coat paint-ready finish',
      'Turnkey vanity, shower/tub, and fixture trim-out',
      'Dynamic high-pressure leak testing prior to close-out'
    ]
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/projects.json');
    appData = await res.json();
  } catch (e) {
    console.warn('Projects data fallback notice:', e);
  }

  // Handle URL hash navigation
  window.addEventListener('hashchange', handleHashRouting);
  handleHashRouting();
});

// Hash Routing
function handleHashRouting() {
  const hash = window.location.hash.replace('#', '') || 'root';
  const parts = hash.split('/');

  if (parts[0] === 'work') {
    if (parts[1]) {
      showTradeView(parts[1], false);
    } else {
      showWorkCategoriesView(false);
    }
  } else if (parts[0] === 'estimations') {
    showEstimationsView(false);
  } else if (parts[0] === 'contact') {
    showContactView(false);
  } else {
    showRootView(false);
  }
}

// --------------------------------------------------------------------------
// VIEW RENDERERS
// --------------------------------------------------------------------------

function renderBreadcrumb(crumbs) {
  const bar = document.getElementById('breadcrumb-bar');
  if (!crumbs || crumbs.length === 0) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }

  bar.style.display = 'flex';
  let html = `<button class="btn-back-crumb" onclick="goBackCrumb()">← Back</button><div class="crumb-trail">`;
  crumbs.forEach((c, idx) => {
    if (idx === crumbs.length - 1) {
      html += `<span class="active">${c.label}</span>`;
    } else {
      html += `<a href="${c.hash}">${c.label}</a> <span style="color:#555;">/</span> `;
    }
  });
  html += `</div>`;
  bar.innerHTML = html;
}

function goBackCrumb() {
  if (currentView === 'trade') {
    window.location.hash = '#work';
  } else {
    window.location.hash = '#root';
  }
}

// 1. Root Gateway View
function showRootView(updateHash = true) {
  currentView = 'root';
  if (updateHash) window.location.hash = '#root';
  renderBreadcrumb([]);

  const stage = document.getElementById('stage-view');
  stage.innerHTML = `
    <div class="view-stage">
      <!-- High-Signal Contractor Hero Card -->
      <section class="contractor-hero-card" aria-label="Contractor Overview">
        <div class="hero-status-pill">
          <span class="live-pulse"></span>
          <span>WISCONSIN SPS 321 CERTIFIED DWELLING CONTRACTOR</span>
        </div>
        
        <h1 class="hero-main-title">
          Built for Central Wisconsin.<br>
          <span class="text-green">Grounded in Physical Proof.</span>
        </h1>
        
        <p class="hero-body-text">
          Owner-operated contracting by <strong>John Dondlinger</strong>. We deliver commercial & residential <strong>4,000 PSI concrete flatwork</strong>, <strong>structural framing & additions</strong>, <strong>Level 4/5 drywall</strong>, <strong>remodels</strong>, and <strong>exterior envelope builds</strong> across Wisconsin Rapids, Stevens Point, and Wood County.
        </p>

        <div class="hero-trust-grid">
          <div class="trust-badge">
            <span class="trust-icon">📍</span>
            <span>Wood & Portage Counties</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">📐</span>
            <span>100% Authentic Photos</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">⚡</span>
            <span>Direct Owner Access</span>
          </div>
          <div class="trust-badge">
            <span class="trust-icon">🛡️</span>
            <span>Zero Sales Middlemen</span>
          </div>
        </div>
      </section>

      <!-- 5-Trade Quick Jump Strip -->
      <section class="trades-jump-section" aria-label="Trade Disciplines Quick Access">
        <div class="section-label-strip">
          <span>Jump Directly to Trade Proof:</span>
        </div>
        <div class="trade-pills-scroll">
          <a href="#work/concrete" class="trade-pill" onclick="showTradeView('concrete')">
            <span>🧱</span> Concrete
          </a>
          <a href="#work/drywall" class="trade-pill" onclick="showTradeView('drywall')">
            <span>📐</span> Drywall
          </a>
          <a href="#work/framing" class="trade-pill" onclick="showTradeView('framing')">
            <span>🏗️</span> Framing
          </a>
          <a href="#work/remodels" class="trade-pill" onclick="showTradeView('remodels')">
            <span>🔨</span> Remodels
          </a>
          <a href="#work/roofing" class="trade-pill" onclick="showTradeView('roofing')">
            <span>🛡️</span> Roofing
          </a>
        </div>
      </section>

      <!-- 3-Gateway Action Pathways -->
      <div class="menu-prompt" style="margin-top:4px;">
        <span>⚡ Action Pathways</span>
      </div>

      <a href="#work" class="tactile-card-btn" onclick="showWorkCategoriesView()">
        <div class="btn-left">
          <div class="card-icon">🔨</div>
          <div class="card-info">
            <span class="card-title">Work & Projects</span>
            <span class="card-sub">Browse authentic before/after proof & job specs across our 5 trades</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>

      <a href="#estimations" class="tactile-card-btn" onclick="showEstimationsView()">
        <div class="btn-left">
          <div class="card-icon">💰</div>
          <div class="card-info">
            <span class="card-title">Estimations</span>
            <span class="card-sub">Interactive square footage sliders & transparent ballpark pricing</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>

      <a href="#contact" class="tactile-card-btn" onclick="showContactView()">
        <div class="btn-left">
          <div class="card-icon">📞</div>
          <div class="card-info">
            <span class="card-title">Contact & Dispatch</span>
            <span class="card-sub">Direct call, text, or instant plan & photo submission to John's phone</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>

      <!-- Quick Call Direct Strip -->
      <div class="quick-call-strip">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Have a project starting in Central Wisconsin?</div>
        <a href="tel:7154593050" class="btn-direct-dial">
          <span>📞 Call or Text John Directly: (715) 459-3050</span>
        </a>
        <div style="font-size:11px;color:var(--text-dim);margin-top:10px;line-height:1.4;">
          🛡️ Licensed, insured & personally built on every jobsite. Zero sales reps, zero middleman markups.
        </div>
      </div>
    </div>
  `;
}

// 2. Work & Projects: 5 Core Trades
function showWorkCategoriesView(updateHash = true) {
  currentView = 'work';
  if (updateHash) window.location.hash = '#work';
  renderBreadcrumb([
    { label: 'Home', hash: '#root' },
    { label: 'Work & Projects', hash: '#work' }
  ]);

  if (!appData || !appData.categories) return;

  const stage = document.getElementById('stage-view');
  let html = `
    <div class="view-stage">
      <div class="menu-prompt">
        <span>Select Trade Discipline:</span>
      </div>
  `;

  appData.categories.forEach(cat => {
    html += `
      <a href="#work/${cat.id}" class="tactile-card-btn" onclick="showTradeView('${cat.id}')">
        <div class="btn-left">
          <div class="card-icon">${cat.icon}</div>
          <div class="card-info">
            <span class="card-title">${cat.name}</span>
            <span class="card-sub">${cat.tagline}</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>
    `;
  });

  html += `</div>`;
  stage.innerHTML = html;
}

// 3. Trade Detail View with Before/After Slideshows
function showTradeView(tradeId, updateHash = true) {
  currentView = 'trade';
  selectedTradeId = tradeId;
  if (updateHash) window.location.hash = `#work/${tradeId}`;

  const category = (appData && appData.categories) 
    ? appData.categories.find(c => c.id === tradeId) 
    : null;

  const tradeName = category ? category.name : 'Projects';

  renderBreadcrumb([
    { label: 'Home', hash: '#root' },
    { label: 'Work', hash: '#work' },
    { label: tradeName, hash: `#work/${tradeId}` }
  ]);

  const stage = document.getElementById('stage-view');
  if (!category || !category.projects || category.projects.length === 0) {
    stage.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No projects recorded for this category yet.</div>`;
    return;
  }

  let html = `<div class="view-stage">`;

  category.projects.forEach(proj => {
    if (!slideIndices[proj.id]) slideIndices[proj.id] = 0;
    const currentIdx = slideIndices[proj.id];

    html += `
      <div class="project-card" id="card-${proj.id}">
        <div class="project-card-header">
          <div class="project-title">${proj.title}</div>
          <div class="project-location">📍 ${proj.location}</div>
          <div class="project-scope">${proj.scope}</div>
        </div>

        <!-- Before & After Slideshow Container -->
        <div class="slideshow-wrap" id="slideshow-${proj.id}" 
             ontouchstart="handleTouchStart(event, '${proj.id}')" 
             ontouchend="handleTouchEnd(event, '${proj.id}')">
    `;

    proj.slides.forEach((slide, sIdx) => {
      const isActive = sIdx === currentIdx;
      html += `
        <div class="slide-item ${isActive ? 'active' : ''}" data-slide-index="${sIdx}">
          <span class="slide-badge ${slide.type}">${slide.label}</span>
          <span class="slide-counter">${sIdx + 1} / ${proj.slides.length}</span>
          <img src="${slide.src}" alt="${slide.caption}" class="slide-img" loading="lazy">
          <div class="slide-caption-bar">${slide.caption}</div>
        </div>
      `;
    });

    if (proj.slides.length > 1) {
      html += `
        <button class="slide-nav-btn prev" onclick="prevSlide('${proj.id}')" aria-label="Previous Slide">‹</button>
        <button class="slide-nav-btn next" onclick="nextSlide('${proj.id}')" aria-label="Next Slide">›</button>
      `;
    }

    html += `
        </div>

        <div class="project-card-body">
          <ul class="specs-list">
    `;

    proj.specs.forEach(spec => {
      html += `<li><span class="spec-check">✓</span> <span>${spec}</span></li>`;
    });

    html += `
          </ul>

          <div class="project-ballpark-tag">
            <span class="ballpark-label">Typical Ballpark Range</span>
            <span class="ballpark-price">${proj.ballpark}</span>
          </div>

          <div class="project-actions">
            <a href="#estimations" class="btn-action-quote" onclick="startQuoteForTrade('${tradeId}', '${encodeURIComponent(proj.title)}')">
              📷 Get Written Quote
            </a>
            <a href="sms:+17154593050?body=${encodeURIComponent('Hi John, I saw your ' + proj.title + ' project on your website. Can we talk about my job?')}" class="btn-action-text">
              💬 Text John
            </a>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  stage.innerHTML = html;
}

// --------------------------------------------------------------------------
// SLIDESHOW CONTROLLER & TOUCH SWIPE MECHANICS
// --------------------------------------------------------------------------

function showSlide(projId, index) {
  const container = document.getElementById(`slideshow-${projId}`);
  if (!container) return;

  const slides = container.querySelectorAll('.slide-item');
  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;

  slideIndices[projId] = index;
  slides.forEach((s, idx) => {
    s.classList.toggle('active', idx === index);
  });
}

function nextSlide(projId) {
  const current = slideIndices[projId] || 0;
  showSlide(projId, current + 1);
}

function prevSlide(projId) {
  const current = slideIndices[projId] || 0;
  showSlide(projId, current - 1);
}

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e, projId) {
  if (e.touches && e.touches[0]) {
    touchStartX = e.touches[0].clientX;
  }
}

function handleTouchEnd(e, projId) {
  if (e.changedTouches && e.changedTouches[0]) {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide(projId);
      else prevSlide(projId);
    }
  }
}

// --------------------------------------------------------------------------
// ESTIMATIONS VIEW & PRICING SLIDERS
// --------------------------------------------------------------------------

function showEstimationsView(updateHash = true) {
  currentView = 'estimations';
  if (updateHash) window.location.hash = '#estimations';
  renderBreadcrumb([
    { label: 'Home', hash: '#root' },
    { label: 'Estimations', hash: '#estimations' }
  ]);

  const cfg = ESTIMATE_CONFIGS[currentSliderTrade];
  const stage = document.getElementById('stage-view');

  stage.innerHTML = `
    <div class="view-stage">
      <div class="estimator-panel">
        <div style="font-size:13px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">
          Step 1: Choose Trade
        </div>

        <div class="trade-pill-selector">
          <button class="trade-pill ${currentSliderTrade === 'concrete' ? 'active' : ''}" onclick="selectEstimateTrade('concrete')">🧱 Concrete</button>
          <button class="trade-pill ${currentSliderTrade === 'decks' ? 'active' : ''}" onclick="selectEstimateTrade('decks')">🪵 Decks</button>
          <button class="trade-pill ${currentSliderTrade === 'framing' ? 'active' : ''}" onclick="selectEstimateTrade('framing')">🏗️ Framing</button>
          <button class="trade-pill ${currentSliderTrade === 'roofing' ? 'active' : ''}" onclick="selectEstimateTrade('roofing')">🛡️ Roofing</button>
          <button class="trade-pill ${currentSliderTrade === 'remodels' ? 'active' : ''}" onclick="selectEstimateTrade('remodels')">🔨 Remodels</button>
        </div>

        <div class="slider-container" id="slider-box">
          <div class="slider-header">
            <span id="slider-label-desc">${cfg.tag} Scope:</span>
            <span class="slider-val-badge" id="slider-val-display">${cfg.defaultVal} ${cfg.unit}</span>
          </div>
          <input type="range" id="scope-slider" class="range-slider" 
                 min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${cfg.defaultVal}" 
                 oninput="handleSliderChange()">
        </div>

        <div class="project-ballpark-tag" style="margin:0;">
          <span class="ballpark-label">Estimated Turnkey Range</span>
          <span class="ballpark-price" id="calc-price-display">$0</span>
        </div>

        <ul class="specs-list" id="calc-inclusions-list" style="margin:0;">
          ${cfg.notes.map(n => `<li><span class="spec-check">✓</span> <span>${n}</span></li>`).join('')}
        </ul>

        <!-- PourReady Kiosk Link -->
        <a href="https://calc.dondlingergc.com" target="_blank" rel="noopener" class="pourready-banner">
          <div>
            <div style="font-size:14px;font-weight:800;color:#f97316;">🧱 Launch PourReady™ Concrete Volume Calculator</div>
            <div style="font-size:11px;color:#a1a1aa;margin-top:2px;">Calculate exact cubic yards for slabs, footings, and walls (calc.dondlingergc.com)</div>
          </div>
          <span style="color:#f97316;font-size:18px;font-weight:800;">→</span>
        </a>
      </div>

      <!-- Step 2: Request Written Measure Form -->
      <div class="quote-form-wrap" id="quote-form-section">
        <div style="font-size:16px;font-weight:800;color:#fff;">Step 2: Request Your Written Quote</div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
          Snap 1–3 photos of your space. John reviews all specs and follows up promptly.
        </div>

        <div id="lead-status-box" class="status-alert"></div>

        <form id="leadCaptureForm" onsubmit="handleLeadSubmit(event)">
          <div class="form-group">
            <input type="text" id="leadName" class="form-input" placeholder="Your Name (Optional)">
          </div>
          <div class="form-group">
            <input type="text" id="leadContact" class="form-input" placeholder="Phone Number or Email (Required) *" required>
          </div>
          <div class="form-group">
            <input type="text" id="leadCity" class="form-input" placeholder="City or Township (e.g. Wisconsin Rapids, Stevens Point)">
          </div>
          <div class="form-group">
            <textarea id="leadNotes" class="form-input" rows="2" placeholder="Brief project notes (e.g. 2-car garage apron replacement, back deck)..."></textarea>
          </div>

          <label for="leadPhotoInput" class="file-box-label">
            <div style="font-size:18px;">📷</div>
            <div style="font-size:12px;font-weight:700;color:var(--accent-green);margin-top:2px;">Optional: Tap to Attach 1–3 Photos</div>
            <div style="font-size:11px;color:var(--text-dim);">Phone snapshots of your existing project area</div>
          </label>
          <input type="file" id="leadPhotoInput" accept="image/*" multiple onchange="handlePhotoUpload(event)" style="display:none;">
          <div id="photo-preview-rail" style="display:flex;gap:6px;overflow-x:auto;margin-top:6px;"></div>

          <button type="submit" id="btn-submit-quote" class="btn-submit-lead" style="margin-top:10px;">
            <span>🚀 Send Quote Request to John</span>
          </button>
        </form>
      </div>
    </div>
  `;

  calculateCurrentPrice();
}

function selectEstimateTrade(tradeKey) {
  currentSliderTrade = tradeKey;
  showEstimationsView(false);
}

function startQuoteForTrade(tradeKey, projectTitle) {
  currentSliderTrade = tradeKey;
  showEstimationsView(true);
  setTimeout(() => {
    const notes = document.getElementById('leadNotes');
    if (notes) {
      notes.value = `Interested in: ${decodeURIComponent(projectTitle)}`;
    }
    const formSec = document.getElementById('quote-form-section');
    if (formSec) formSec.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function handleSliderChange() {
  const slider = document.getElementById('scope-slider');
  const valDisplay = document.getElementById('slider-val-display');
  const cfg = ESTIMATE_CONFIGS[currentSliderTrade];

  if (cfg.customLabels) {
    valDisplay.textContent = cfg.customLabels[slider.value];
  } else {
    valDisplay.textContent = `${slider.value} ${cfg.unit}`;
  }

  calculateCurrentPrice();
}

function calculateCurrentPrice() {
  const cfg = ESTIMATE_CONFIGS[currentSliderTrade];
  const slider = document.getElementById('scope-slider');
  const priceDisplay = document.getElementById('calc-price-display');
  if (!slider || !priceDisplay) return;

  const val = parseInt(slider.value, 10);

  if (cfg.customRanges) {
    priceDisplay.textContent = cfg.customRanges[val];
    return;
  }

  const low = Math.round((val * cfg.rateMin) / 50) * 50;
  const high = Math.round((val * cfg.rateMax) / 50) * 50;

  priceDisplay.textContent = `$${low.toLocaleString()} – $${high.toLocaleString()}`;
}

function handlePhotoUpload(e) {
  const files = Array.from(e.target.files || []);
  selectedPhotos = files.slice(0, 3);
  const rail = document.getElementById('photo-preview-rail');
  if (!rail) return;
  rail.innerHTML = '';

  selectedPhotos.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.width = '54px';
      img.style.height = '54px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';
      img.style.border = '1px solid var(--accent-green)';
      rail.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

async function handleLeadSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-quote');
  const alertBox = document.getElementById('lead-status-box');
  btn.disabled = true;
  btn.textContent = 'Submitting Request...';

  const cfg = ESTIMATE_CONFIGS[currentSliderTrade];
  const slider = document.getElementById('scope-slider');
  const sliderVal = slider ? slider.value : '';
  const priceRange = document.getElementById('calc-price-display')?.textContent || '';
  const name = document.getElementById('leadName')?.value.trim() || 'Website Client';
  const contact = document.getElementById('leadContact')?.value.trim();
  const city = document.getElementById('leadCity')?.value.trim() || 'Central Wisconsin';
  const userNotes = document.getElementById('leadNotes')?.value.trim() || 'No additional notes';

  let leadId = 'DGC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const formData = new FormData();
  formData.append('lead_type', 'client');
  formData.append('origin', 'dondlingergc.com (3-Gateway Stealth Portal)');
  formData.append('name', name);
  formData.append('contact', contact);
  formData.append('city', city);
  formData.append('service', `${cfg.tag} (${sliderVal} ${cfg.unit}) — ${priceRange}`);
  formData.append('notes', userNotes);

  selectedPhotos.forEach((file, idx) => {
    formData.append(`photo_${idx}`, file, file.name);
  });

  try {
    const res = await fetch('/api/dispatch', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data && data.lead_id) leadId = data.lead_id;
    }
  } catch (err) {
    console.warn('Dispatch network log:', err);
  }

  alertBox.className = 'status-alert success';
  alertBox.innerHTML = `✅ <strong>Quote Request Received! Ref #${leadId}</strong><br>Thank you ${name}! John Dondlinger will review your project details and follow up promptly.`;

  btn.textContent = `✅ Sent! Ref #${leadId}`;
  btn.style.background = '#16a34a';

  document.getElementById('leadCaptureForm').reset();
  document.getElementById('photo-preview-rail').innerHTML = '';
  selectedPhotos = [];
}

// --------------------------------------------------------------------------
// CONTACT VIEW
// --------------------------------------------------------------------------

function showContactView(updateHash = true) {
  currentView = 'contact';
  if (updateHash) window.location.hash = '#contact';
  renderBreadcrumb([
    { label: 'Home', hash: '#root' },
    { label: 'Contact', hash: '#contact' }
  ]);

  const stage = document.getElementById('stage-view');
  stage.innerHTML = `
    <div class="view-stage">
      <div class="menu-prompt">
        <span>Direct Contractor Communication:</span>
      </div>

      <div class="contact-grid">
        <a href="tel:7154593050" class="contact-card">
          <div class="contact-card-icon">📞</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#fff;">(715) 459-3050</div>
            <div style="font-size:12px;color:var(--accent-green);font-weight:700;">Tap to Call John Directly</div>
          </div>
        </a>

        <a href="sms:+17154593050?body=Hi%20John%2C%20I%20have%20a%20project%20in%20Central%20Wisconsin%20and%20would%20like%20to%20get%20an%20estimate." class="contact-card">
          <div class="contact-card-icon">💬</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#fff;">Text (715) 459-3050</div>
            <div style="font-size:12px;color:var(--text-muted);">Quick text message regarding your project</div>
          </div>
        </a>

        <a href="mailto:dondlingergeneralcontracting@gmail.com" class="contact-card">
          <div class="contact-card-icon">✉️</div>
          <div>
            <div style="font-size:15px;font-weight:800;color:#fff;">dondlingergeneralcontracting@gmail.com</div>
            <div style="font-size:12px;color:var(--text-muted);">Send plans, blueprints, or documents</div>
          </div>
        </a>

        <div class="contact-card" style="cursor:default;">
          <div class="contact-card-icon">📍</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#fff;">Central Wisconsin Service Area</div>
            <div style="font-size:12px;color:var(--text-muted);">
              Wisconsin Rapids, Stevens Point, Plover, Marshfield, Nekoosa, Port Edwards, and surrounding Wood & Portage Counties.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
