// ==========================================================================
// DONDLINGER GENERAL CONTRACTING — 3-GATEWAY DECISION TREE ENGINE (v3.0.0)
// Authentic Proof, Turnkey Packages, and 3-Way Telegram Dispatch Bridge
// ==========================================================================

let appData = null;
let currentView = 'root'; // 'root' | 'work' | 'trade' | 'estimations' | 'contact'
let selectedTradeId = null;
let currentPackageTrade = 'concrete';
let selectedPhotos = [];
const slideIndices = {}; // projectId -> currentSlideIndex

// 3-Way Live Chat State
let chatPollingInterval = null;
let lastChatTimestamp = 0;
let chatMessagesList = [];

// ==========================================================================
// TURNKEY PACKAGES REPLACING GENERIC SLIDERS (A : B :: C : D*)
// Grounded in Central Wisconsin Historical Takeoffs and Supplier Economics
// ==========================================================================
const TURNKEY_PACKAGES = {
  concrete: {
    tradeName: 'Concrete Flatwork',
    packages: [
      {
        id: 'curved-walkway-retaining',
        title: 'Curved Entry Walkway & Dry-Stack Stone Wall Reset',
        tag: 'Authentic Cooper Job Baseline',
        price: '$3,200 – $5,400 turnkey',
        featured: true,
        specs: [
          '4,000 PSI Badgerland ready-mix with 6% air-entrainment',
          '4" mechanically compacted dense-graded granular base (DGB)',
          'Epoxied #4 structural rebar dowels pinned directly into foundation',
          'Hand-tooled control joints grooved during the pour (zero saw cuts)',
          'Uniform non-slip brushed broom texture with clean edged border margins',
          'Landscape retaining wall dismantled and rebuilt plumb to new grade'
        ]
      },
      {
        id: 'garage-apron-patio',
        title: '2-Car Garage Apron & Patio Repour (400–550 sq ft)',
        tag: 'Central Wisconsin Standard',
        price: '$4,500 – $7,200 turnkey',
        featured: false,
        specs: [
          'Tear-out and haul-away of cracked, heaved existing slab',
          'Laser subgrade leveling with compacted crushed rock base',
          'Heavy #4 rebar grid pinned into garage foundation stem wall',
          '4,000 PSI exterior mix with fiber reinforcement and air entrainment',
          'Deep hand-tooled relief grooves cut wet to prevent frost heave fractures'
        ]
      },
      {
        id: 'full-driveway-replacement',
        title: 'Complete 2-Car Driveway Replacement (700–1,100 sq ft)',
        tag: 'Heavy Vehicle Loading',
        price: '$8,500 – $14,500 turnkey',
        featured: false,
        specs: [
          'Full mechanical excavation down to stable subgrade',
          'Heavy 5" compacted gravel substrate with drainage pitch away from structure',
          'Expansion isolation joints along garage slab and sidewalk interfaces',
          'Continuous steel rebar grid tied on chairs for mid-slab placement',
          'Architectural broom finish with sealed edges and curing protection'
        ]
      }
    ]
  },
  decks: {
    tradeName: 'Custom Decks & Heavy Stairs',
    packages: [
      {
        id: 'stair-stringer-rebuild',
        title: 'Custom 2x12 Treated Stair Stringers & Landings',
        tag: '8820 Lake Road Baseline',
        price: '$2,400 – $4,200 turnkey',
        featured: true,
        specs: [
          'Precision-cut pressure-treated 2x12 stair stringers',
          'Uniform 7-inch rise and 11-inch run code-compliant geometry',
          'Composite treads with concealed clip fasteners (no surface screws)',
          'Enclosed weather-resistant risers and solid timber support blocking',
          'Rigid through-bolted 4x4 railing posts with continuous graspable handrail'
        ]
      },
      {
        id: 'turnkey-composite-deck',
        title: 'Turnkey 12x16 Composite Deck with Railings',
        tag: 'Low-Maintenance Outdoor Living',
        price: '$11,000 – $18,000 turnkey',
        featured: false,
        specs: [
          '48" below-frost concrete piers with galvanized Simpson post anchors',
          'Treated 2x10 joist framing supported on heavy 6x6 carrying beams',
          'Trex or TimberTech capped composite surface decking in choice of finish',
          'Hidden clip fastening system with picture-frame perimeter border',
          'Powder-coated aluminum or composite railing system with code spacing'
        ]
      },
      {
        id: 'deck-reface-posts',
        title: 'Substructure Audit, Deck Board Reface & New Railings',
        tag: 'Substructure Preservation',
        price: '$6,500 – $11,500 turnkey',
        featured: false,
        specs: [
          'Structural inspection of existing joists, ledger board, and flashing',
          'Replacement of failing timber members and added joist tape protection',
          'New composite or treated surface decking installed with hidden fasteners',
          'Heavy railing post upgrades and custom stair tie-in'
        ]
      }
    ]
  },
  framing: {
    tradeName: 'Structural Framing & Additions',
    packages: [
      {
        id: 'two-story-addition-shell',
        title: 'Two-Story Residential Addition & Shell Enclosure',
        tag: 'Dickman Addition Baseline',
        price: '$180 – $310 / sq ft turnkey shell',
        featured: true,
        specs: [
          'Wisconsin SPS 321 Uniform Dwelling Code structural compliance',
          'Treated mudsill tie-in with engineered sill seal into foundation',
          'Engineered multi-ply LVL floor carrying beams and heavy door headers',
          '2x6 exterior wall framing at 16" O.C. for maximum insulation cavity',
          'LP WeatherLogic air and water barrier sheathing with taped seams',
          'Towable spider boom lift staging for safe two-story access'
        ]
      },
      {
        id: 'roof-truss-valley-tiein',
        title: 'Engineered Roof Truss System & Valley Framing Tie-In',
        tag: 'Roof Geometry Tie-In',
        price: '$15 – $28 / sq ft framing package',
        featured: false,
        specs: [
          'Factory-engineered clear-span roof trusses stamped for Central WI snow loads',
          'Simpson Strong-Tie hurricane ties at every plate connection',
          'Gable ladder framing and engineered valley layover tied into existing roofline',
          'Heavy 5/8" CDX roof decking with H-clips and edge spacing'
        ]
      },
      {
        id: 'detached-garage-shell',
        title: 'Detached 24x24 2-Car Garage Shell Framing',
        tag: 'Turnkey Outbuilding Shell',
        price: '$26,000 – $44,000 turnkey shell',
        featured: false,
        specs: [
          'Anchor bolted treated sole plates onto cured concrete slab',
          '2x4 exterior wall framing with double top plates and corner bracing',
          'Engineered 24-ft span storage trusses with 4/12 pitch',
          'Weather-resistant wall and roof sheathing ready for siding and shingles'
        ]
      }
    ]
  },
  remodels: {
    tradeName: 'Remodels & Carpentry',
    packages: [
      {
        id: 'portico-rot-rebuild',
        title: 'Front Porch Rot Teardown & Portico Rebuild',
        tag: 'Winter Overhaul Baseline',
        price: '$3,800 – $7,200 turnkey',
        featured: true,
        specs: [
          'Structural temporary shoring installed during winter freeze',
          'Surgical demolition of rotted load-bearing overhang beams and decayed rafters',
          'Treated structural support posts and rebuilt gable pediment framing',
          'R-Matte Plus-3 rigid foam continuous insulation barrier',
          'Rafter collar ties, fascia wraps, and sealed weather envelope'
        ]
      },
      {
        id: 'bathroom-complete-overhaul',
        title: 'Complete Bathroom Overhaul & Tile/Tub Trim-Out',
        tag: 'Turnkey Plumbing & Finishes',
        price: '$6,500 – $14,000 turnkey',
        featured: false,
        specs: [
          'Subfloor demolition, leveling, and structural moisture inspection',
          'Plumbing rough-ins and GFCI electrical relocation',
          'Moisture-resistant Sheetrock with smooth Level 4 paint-ready skim',
          'Custom walk-in shower or tub surround with waterproof membrane',
          'Turnkey vanity, faucet, toilet, and fixture installation'
        ]
      },
      {
        id: 'commercial-interior-remodel',
        title: 'Commercial Interior Framing & Demolition',
        tag: 'Elks Club Baseline',
        price: '$6,500 – $18,000 commercial package',
        featured: false,
        specs: [
          'Dust-containment barriers and safety barricades',
          'Interior partition demolition down to structural frame',
          'Heavy commercial steel and timber stud modifications',
          'Subfloor leveling and mechanical rough-in coordination'
        ]
      }
    ]
  },
  siding: {
    tradeName: 'Siding, Windows & Trim',
    packages: [
      {
        id: 'two-story-siding-envelope',
        title: 'Two-Story Siding Tear-Off & Exterior Envelope Wrap',
        tag: 'Central Wisconsin Whole-House',
        price: '$14,000 – $24,000 turnkey',
        featured: true,
        specs: [
          'Complete exterior siding stripped down to sound substrate',
          'Continuous silver foil-faced rigid insulation or housewrap barrier',
          'Durable lap siding with wide corner trim posts',
          'On-site precision 10-ft aluminum brake-metal window casing wraps',
          'Continuous perforated vinyl soffit panels and aluminum fascia wraps'
        ]
      },
      {
        id: 'brake-metal-scalloped-gables',
        title: 'On-Site 10-ft Brake Metal & Scalloped Shake Gables',
        tag: 'Custom Architectural Trim',
        price: '$3,500 – $6,500 gable & trim overhaul',
        featured: false,
        specs: [
          'On-site aluminum sheet metal bending on 10-foot brake',
          'Hemmed casing wrap around replacement windows with polyurethane weather seal',
          'Decorative scalloped shake siding accenting upper gables',
          'Integrated J-channel trim and drip edge protection'
        ]
      }
    ]
  }
};

// ==========================================================================
// APP INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/projects.json?v=3.0.0');
    appData = await res.json();
  } catch (e) {
    console.warn('Projects data fallback notice:', e);
  }

  // Handle URL hash navigation
  window.addEventListener('hashchange', handleHashRouting);
  handleHashRouting();

  // Initialize Chat Session ID
  initChatSession();
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
// BREADCRUMBS
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

// ==========================================================================
// 1. ROOT GATEWAY VIEW
// ==========================================================================
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
          Owner-operated contracting by <strong>John Dondlinger</strong>. We deliver commercial & residential <strong>4,000 PSI concrete flatwork</strong> (hand-tooled joints, zero saw cuts), <strong>structural framing & additions</strong>, <strong>Level 4/5 drywall & soffits</strong>, <strong>custom decks</strong>, and <strong>remodels</strong> across Wisconsin Rapids, Stevens Point, and Wood County.
        </p>

        <!-- Authentic Jobsite Featured Image -->
        <div class="hero-media-wrapper">
          <img src="images/projects/concrete_cooper_finished.webp" alt="Poured Curved Walkway and Retaining Wall - Wisconsin Rapids" class="hero-featured-image" loading="eager">
          <div class="hero-image-overlay">
            <span class="hero-badge-tag">AUTHENTIC CRAFTSMANSHIP PROOF</span>
            <span class="hero-badge-loc">📍 Wisconsin Rapids • 4,000 PSI Poured Walkway & Reset Wall</span>
          </div>
        </div>

        <div class="hero-trust-grid" style="margin-top:10px;">
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

      <!-- Inline Service Area Map -->
      <section class="service-map-card" aria-label="Central Wisconsin Service Territory">
        <div class="service-map-header">
          <span>Service Area Coverage:</span>
          <span class="service-map-badge">Wood & Portage Counties • 0 Trip Fees</span>
        </div>
        
        <!-- Deterministic SVG Map -->
        <svg class="service-area-svg" viewBox="0 0 500 240" xmlns="http://www.w3.org/2000/svg">
          <rect width="500" height="240" fill="#09090b" rx="8"/>
          
          <!-- County Boundaries (Subtle Grid) -->
          <path d="M 50 20 L 250 20 L 250 220 L 50 220 Z" fill="none" stroke="#222" stroke-width="1.5" stroke-dasharray="4,4"/>
          <text x="60" y="38" fill="#52525b" font-size="10" font-family="sans-serif" font-weight="700">WOOD COUNTY</text>
          
          <path d="M 250 20 L 450 20 L 450 220 L 250 220 Z" fill="none" stroke="#222" stroke-width="1.5" stroke-dasharray="4,4"/>
          <text x="260" y="38" fill="#52525b" font-size="10" font-family="sans-serif" font-weight="700">PORTAGE COUNTY</text>

          <!-- Primary Operating Radius Ring (Centered on Rapids) -->
          <circle cx="210" cy="120" r="95" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="6,4"/>

          <!-- Wisconsin River Corridor -->
          <path d="M 360 30 Q 300 80 230 110 T 190 170 T 180 230" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
          <path d="M 360 30 Q 300 80 230 110 T 190 170 T 180 230" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="8,4" opacity="0.6"/>

          <!-- Town Markers -->
          <!-- Marshfield -->
          <circle cx="100" cy="65" r="4.5" fill="#a1a1aa"/>
          <text x="110" y="69" fill="#e4e4e7" font-size="11" font-weight="600" font-family="sans-serif">Marshfield</text>

          <!-- Wisconsin Rapids (HQ HUB) -->
          <circle cx="210" cy="120" r="7" fill="#22c55e"/>
          <circle cx="210" cy="120" r="14" fill="none" stroke="#22c55e" stroke-width="1.5" opacity="0.5"/>
          <text x="135" y="142" fill="#22c55e" font-size="12" font-weight="800" font-family="sans-serif">★ Wisconsin Rapids (HQ)</text>

          <!-- Port Edwards -->
          <circle cx="185" cy="150" r="4" fill="#a1a1aa"/>
          <text x="95" y="154" fill="#a1a1aa" font-size="10" font-family="sans-serif">Port Edwards</text>

          <!-- Nekoosa -->
          <circle cx="170" cy="180" r="4" fill="#a1a1aa"/>
          <text x="115" y="184" fill="#a1a1aa" font-size="10" font-family="sans-serif">Nekoosa</text>

          <!-- Stevens Point -->
          <circle cx="340" cy="85" r="5.5" fill="#22c55e"/>
          <text x="352" y="89" fill="#f4f4f5" font-size="12" font-weight="700" font-family="sans-serif">Stevens Point</text>

          <!-- Plover -->
          <circle cx="330" cy="115" r="4.5" fill="#a1a1aa"/>
          <text x="342" y="119" fill="#e4e4e7" font-size="11" font-family="sans-serif">Plover</text>

          <!-- Lake Wazeecha / Biron -->
          <circle cx="245" cy="115" r="3.5" fill="#38bdf8"/>
          <text x="254" y="119" fill="#38bdf8" font-size="9" font-family="sans-serif">Lk Wazeecha</text>

          <!-- Rome / Lake Petenwell -->
          <circle cx="190" cy="215" r="4" fill="#a1a1aa"/>
          <text x="202" y="219" fill="#a1a1aa" font-size="10" font-family="sans-serif">Rome / Petenwell</text>
        </svg>

        <!-- Quick 1-Tap Town Selection Chips -->
        <div class="town-chips-grid">
          <span class="town-chip active" onclick="selectTownChip('Wisconsin Rapids')">📍 Wisconsin Rapids</span>
          <span class="town-chip" onclick="selectTownChip('Stevens Point')">📍 Stevens Point</span>
          <span class="town-chip" onclick="selectTownChip('Plover')">📍 Plover</span>
          <span class="town-chip" onclick="selectTownChip('Port Edwards')">📍 Port Edwards</span>
          <span class="town-chip" onclick="selectTownChip('Nekoosa')">📍 Nekoosa</span>
          <span class="town-chip" onclick="selectTownChip('Marshfield')">📍 Marshfield</span>
          <span class="town-chip" onclick="selectTownChip('Rome / Lakes')">📍 Rome / Lakes</span>
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
          <a href="#work/decks" class="trade-pill" onclick="showTradeView('decks')">
            <span>🪵</span> Decks
          </a>
          <a href="#work/remodels" class="trade-pill" onclick="showTradeView('remodels')">
            <span>🔨</span> Remodels
          </a>
          <a href="#work/siding" class="trade-pill" onclick="showTradeView('siding')">
            <span>🏠</span> Siding
          </a>
        </div>
      </section>

      <!-- 3-Gateway Action Pathways -->
      <div class="menu-prompt" style="margin-top:6px;">
        <span>⚡ Action Gateways</span>
      </div>

      <a href="#work" class="tactile-card-btn" onclick="showWorkCategoriesView()">
        <div class="btn-left">
          <div class="card-icon">🔨</div>
          <div class="card-info">
            <span class="card-title">Work & Projects</span>
            <span class="card-sub">Real before/after photos & authentic jobsite video recordings</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>

      <a href="#estimations" class="tactile-card-btn" onclick="showEstimationsView()">
        <div class="btn-left">
          <div class="card-icon">💰</div>
          <div class="card-info">
            <span class="card-title">Turnkey Estimations</span>
            <span class="card-sub">Anchored packages & transparent pricing based on real Wisconsin jobs</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>

      <a href="#contact" class="tactile-card-btn" onclick="showContactView()">
        <div class="btn-left">
          <div class="card-icon">📞</div>
          <div class="card-info">
            <span class="card-title">Contact & Dispatch</span>
            <span class="card-sub">Direct call, text, photo submission, or 3-way live dispatch chat</span>
          </div>
        </div>
        <span class="card-arrow">→</span>
      </a>

      <!-- 3-Way Live Dispatch Banner -->
      <div class="tactile-card-btn" style="border-color:rgba(34,197,94,0.4);background:#0a120a;cursor:pointer;" onclick="toggleChatWindow()">
        <div class="btn-left">
          <div class="card-icon">💬</div>
          <div class="card-info">
            <span class="card-title" style="color:var(--accent-green);">3-Way Live Dispatch Chat</span>
            <span class="card-sub">Chat directly with John Dondlinger (Owner) & crew from your browser</span>
          </div>
        </div>
        <span class="card-arrow" style="color:var(--accent-green);">⚡</span>
      </div>

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

function selectTownChip(town) {
  const chips = document.querySelectorAll('.town-chip');
  chips.forEach(c => {
    c.classList.toggle('active', c.textContent.includes(town));
  });
}

// ==========================================================================
// 2. WORK CATEGORIES VIEW
// ==========================================================================
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

// ==========================================================================
// 3. TRADE DETAIL VIEW WITH VIDEOS AND BEFORE/AFTER SLIDESHOWS
// ==========================================================================
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
    `;

    // Authentic Jobsite Video Player (if video exists for this project)
    if (proj.video) {
      const posterSrc = (proj.slides && proj.slides[1]) ? proj.slides[1].src : '';
      html += `
        <div class="project-video-box">
          <div class="video-header-tag">
            <span>🎬 AUTHENTIC JOBSITE VIDEO RECORDING</span>
          </div>
          <video src="${proj.video}" controls playsinline preload="metadata" class="project-video-player" poster="${posterSrc}"></video>
        </div>
      `;
    }

    // Before & After Slideshow Container
    html += `
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
            <a href="#estimations" class="btn-action-quote" onclick="startQuoteForPackage('${tradeId}', '${encodeURIComponent(proj.title)}')">
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

// ==========================================================================
// 4. ESTIMATIONS VIEW & TURNKEY PACKAGES
// ==========================================================================
function showEstimationsView(updateHash = true) {
  currentView = 'estimations';
  if (updateHash) window.location.hash = '#estimations';
  renderBreadcrumb([
    { label: 'Home', hash: '#root' },
    { label: 'Turnkey Estimations', hash: '#estimations' }
  ]);

  const tradeData = TURNKEY_PACKAGES[currentPackageTrade] || TURNKEY_PACKAGES.concrete;
  const stage = document.getElementById('stage-view');

  let html = `
    <div class="view-stage">
      <div class="estimator-panel">
        <div style="font-size:13px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">
          Step 1: Select Trade Discipline
        </div>

        <div class="trade-pill-selector">
          <button class="trade-pill ${currentPackageTrade === 'concrete' ? 'active' : ''}" onclick="selectPackageTrade('concrete')">🧱 Concrete</button>
          <button class="trade-pill ${currentPackageTrade === 'decks' ? 'active' : ''}" onclick="selectPackageTrade('decks')">🪵 Decks</button>
          <button class="trade-pill ${currentPackageTrade === 'framing' ? 'active' : ''}" onclick="selectPackageTrade('framing')">🏗️ Framing</button>
          <button class="trade-pill ${currentPackageTrade === 'remodels' ? 'active' : ''}" onclick="selectPackageTrade('remodels')">🔨 Remodels</button>
          <button class="trade-pill ${currentPackageTrade === 'siding' ? 'active' : ''}" onclick="selectPackageTrade('siding')">🏠 Siding</button>
        </div>

        <div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">
          Turnkey packages anchored to real Wisconsin jobs. No surprise material markups or travel fees.
        </div>

        <div class="packages-grid">
  `;

  tradeData.packages.forEach(pkg => {
    html += `
      <div class="package-card ${pkg.featured ? 'featured' : ''}" id="pkg-${pkg.id}">
        <div class="package-top">
          <div>
            <div class="package-title">${pkg.title}</div>
            <div class="package-price">${pkg.price}</div>
          </div>
          <span class="package-tag">${pkg.tag}</span>
        </div>

        <ul class="package-specs">
          ${pkg.specs.map(s => `<li><span class="spec-check">✓</span> <span>${s}</span></li>`).join('')}
        </ul>

        <button class="btn-select-package" onclick="choosePackage('${pkg.id}', '${encodeURIComponent(pkg.title)}')">
          📷 Select & Request Written Quote
        </button>
      </div>
    `;
  });

  html += `
        </div>

        <!-- PourReady Kiosk Link -->
        <a href="https://calc.dondlingergc.com" target="_blank" rel="noopener" class="pourready-banner" style="margin-top:14px;">
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
            <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px;">Township / Location:</div>
            <div class="town-chips-grid" style="margin-bottom:6px;">
              <span class="town-chip" onclick="setLeadCity('Wisconsin Rapids')">Wisconsin Rapids</span>
              <span class="town-chip" onclick="setLeadCity('Stevens Point')">Stevens Point</span>
              <span class="town-chip" onclick="setLeadCity('Plover')">Plover</span>
              <span class="town-chip" onclick="setLeadCity('Port Edwards')">Port Edwards</span>
              <span class="town-chip" onclick="setLeadCity('Nekoosa')">Nekoosa</span>
              <span class="town-chip" onclick="setLeadCity('Marshfield')">Marshfield</span>
              <span class="town-chip" onclick="setLeadCity('Other Central WI')">Other</span>
            </div>
            <input type="text" id="leadCity" class="form-input" placeholder="City or Township (e.g. Wisconsin Rapids)">
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

  stage.innerHTML = html;
}

function selectPackageTrade(tradeKey) {
  currentPackageTrade = tradeKey;
  showEstimationsView(false);
}

function choosePackage(pkgId, pkgTitle) {
  const notes = document.getElementById('leadNotes');
  if (notes) {
    notes.value = `Interested in Package: ${decodeURIComponent(pkgTitle)}`;
  }
  const formSec = document.getElementById('quote-form-section');
  if (formSec) {
    formSec.scrollIntoView({ behavior: 'smooth' });
  }
}

function startQuoteForPackage(tradeKey, projectTitle) {
  currentPackageTrade = tradeKey;
  showEstimationsView(true);
  setTimeout(() => {
    choosePackage(tradeKey, projectTitle);
  }, 120);
}

function setLeadCity(city) {
  const input = document.getElementById('leadCity');
  if (input) {
    input.value = city;
  }
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

  const name = document.getElementById('leadName')?.value.trim() || 'Website Client';
  const contact = document.getElementById('leadContact')?.value.trim();
  const city = document.getElementById('leadCity')?.value.trim() || 'Central Wisconsin';
  const userNotes = document.getElementById('leadNotes')?.value.trim() || 'No additional notes';

  let leadId = 'DGC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const formData = new FormData();
  formData.append('lead_type', 'client');
  formData.append('origin', 'dondlingergc.com (3-Gateway Portal v3.0)');
  formData.append('name', name);
  formData.append('contact', contact);
  formData.append('city', city);
  formData.append('service', `${currentPackageTrade} Turnkey Inquiry`);
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

// ==========================================================================
// 5. CONTACT VIEW
// ==========================================================================
function showContactView(updateHash = true) {
  currentView = 'contact';
  if (updateHash) window.location.hash = '#contact';
  renderBreadcrumb([
    { label: 'Home', hash: '#root' },
    { label: 'Contact & Dispatch', hash: '#contact' }
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

        <div class="contact-card" style="cursor:pointer;border-color:rgba(34,197,94,0.4);background:#0a140a;" onclick="toggleChatWindow()">
          <div class="contact-card-icon">⚡</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--accent-green);">3-Way Live Dispatch Chat</div>
            <div style="font-size:12px;color:var(--text-muted);">Instant messaging with John & field team from this device</div>
          </div>
        </div>

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

// ==========================================================================
// 6. 3-WAY LIVE DISPATCH CHAT CONTROLLER
// Client (Web) <-> Worker (Crew / AI Dispatch) <-> Owner (John via Telegram)
// ==========================================================================

function initChatSession() {
  let sid = localStorage.getItem('dgc_chat_sid');
  if (!sid) {
    sid = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    localStorage.setItem('dgc_chat_sid', sid);
  }
  return sid;
}

function toggleChatDropdown() {
  toggleChatWindow();
}

function toggleChatWindow() {
  const modal = document.getElementById('chat-dropdown') || document.getElementById('chat-modal');
  if (!modal) return;

  const isOpen = modal.style.display !== 'none';
  if (isOpen) {
    modal.style.display = 'none';
    if (chatPollingInterval) {
      clearInterval(chatPollingInterval);
      chatPollingInterval = null;
    }
  } else {
    modal.style.display = 'flex';
    fetchChatMessages();
    const input = document.getElementById('chat-input-field');
    if (input) setTimeout(() => input.focus(), 150);

    // Poll for new messages every 3.5 seconds while open
    if (!chatPollingInterval) {
      chatPollingInterval = setInterval(fetchChatMessages, 3500);
    }
  }
}

async function fetchChatMessages() {
  const sid = initChatSession();
  try {
    const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(sid)}&after=${lastChatTimestamp}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.messages && data.messages.length > 0) {
        let hasNew = false;
        data.messages.forEach(msg => {
          if (!chatMessagesList.some(m => m.id === msg.id)) {
            chatMessagesList.push(msg);
            if (msg.created_at > lastChatTimestamp) {
              lastChatTimestamp = msg.created_at;
            }
            hasNew = true;
          }
        });
        if (hasNew) renderChatUI();
      } else if (chatMessagesList.length === 0) {
        renderChatUI();
      }
    }
  } catch (err) {
    console.warn('Chat poll error:', err);
    if (chatMessagesList.length === 0) renderChatUI();
  }
}

function renderChatUI() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  if (chatMessagesList.length === 0) {
    container.innerHTML = `
      <div class="chat-bubble worker">
        <div class="chat-bubble-sender">👷 DGC Dispatch (Crew)</div>
        <div>Welcome to Dondlinger General Contracting! You're connected to our live 3-way dispatch bridge. Ask any question about pricing, scheduling, or materials. John Dondlinger is alerted directly on his phone.</div>
        <div class="chat-bubble-time">Live</div>
      </div>
    `;
    return;
  }

  let html = '';
  chatMessagesList.forEach(m => {
    const roleClass = m.sender_role || 'worker';
    let icon = '👷';
    let roleLabel = m.sender_name || 'DGC Dispatch';

    if (roleClass === 'client') {
      icon = '👤';
      roleLabel = 'You';
    } else if (roleClass === 'owner') {
      icon = '🛡️';
      roleLabel = 'John Dondlinger (Owner)';
    }

    const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    html += `
      <div class="chat-bubble ${roleClass}">
        <div class="chat-bubble-sender">${icon} ${roleLabel}</div>
        <div>${escapeHtml(m.message)}</div>
        <div class="chat-bubble-time">${timeStr}</div>
      </div>
    `;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

async function handleChatSend(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input-field');
  const sendBtn = document.getElementById('chat-send-btn');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  sendBtn.disabled = true;

  const sid = initChatSession();
  const localMsg = {
    id: 'local_' + Date.now(),
    session_id: sid,
    sender_role: 'client',
    sender_name: 'You',
    message: text,
    created_at: Date.now()
  };

  chatMessagesList.push(localMsg);
  renderChatUI();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        name: 'Website Visitor',
        message: text
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.messages) {
        chatMessagesList = data.messages;
        if (data.messages.length > 0) {
          lastChatTimestamp = data.messages[data.messages.length - 1].created_at;
        }
        renderChatUI();
      }
    }
  } catch (err) {
    console.warn('Send chat message error:', err);
  } finally {
    sendBtn.disabled = false;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
