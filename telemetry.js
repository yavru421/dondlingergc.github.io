/**
 * dondlingergc.com — 2026 Unified Client Telemetry & High-Intent Acquisition Engine
 * Standards: Zero-spurious spam, strict session attribution, operator suppression,
 * granular project & photo inspection, calculator tracking, scroll milestones,
 * contact hesitation detection, and real-time heat telemetry.
 */
(function() {
  // 1. Operator Self-Traffic Detection (Prevents self-ping Telegram spam)
  const isResetOperator = window.location.search.includes('reset_operator=1');
  if (isResetOperator) {
    try {
      localStorage.removeItem('dgc_operator');
      sessionStorage.removeItem('dgc_operator');
    } catch (e) {}
  }

  const isTestDispatch = window.location.search.includes('test_dispatch=1') || window.location.search.includes('test_telemetry=1');
  const isOperatorParam = window.location.search.includes('operator=1') || window.location.search.includes('admin=1');
  if (isOperatorParam) {
    try {
      localStorage.setItem('dgc_operator', 'true');
      sessionStorage.setItem('dgc_operator', 'true');
    } catch (e) {}
  }
  const isOperator = !isTestDispatch && (
    isOperatorParam ||
    localStorage.getItem('dgc_operator') === 'true' ||
    sessionStorage.getItem('dgc_operator') === 'true'
  );

  // 2. Session Persistence across page navigations in current tab
  let sid = sessionStorage.getItem('dgc_sid');
  if (!sid) {
    sid = 's_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
    sessionStorage.setItem('dgc_sid', sid);
  }

  const sessionStartTime = Date.now();
  let currentSection = document.title || 'Home';
  const trackedScrollMilestones = new Set();

  // 3. Extract & Cache Marketing Attribution Parameters + Client Timezone Hints
  function getAttribution() {
    let attr = null;
    try {
      const cached = sessionStorage.getItem('dgc_attr');
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    const params = new URLSearchParams(window.location.search);
    let clientTz = 'America/Chicago';
    try {
      clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago';
    } catch (e) {}

    attr = {
      referrer: document.referrer || 'direct',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || '',
      landing_path: window.location.pathname + window.location.hash,
      timezone: clientTz,
      language: navigator.language || 'en-US',
      screen_res: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    try {
      sessionStorage.setItem('dgc_attr', JSON.stringify(attr));
    } catch (e) {}

    return attr;
  }

  const attribution = getAttribution();

  // 4. Core Dispatch Engine (sendBeacon with fetch keepalive fallback)
  function trackEvent(eventType, payload = {}) {
    const dwell = Math.round((Date.now() - sessionStartTime) / 1000);
    const body = JSON.stringify({
      sid: sid,
      event: eventType,
      section: payload.section || currentSection,
      project: payload.project || '',
      trade: payload.trade || 'General',
      ballpark: payload.ballpark || '',
      details: payload.details || '',
      scroll_depth: payload.scroll_depth || 0,
      photo_index: payload.photo_index ?? null,
      dwell_sec: dwell,
      is_operator: isOperator,
      test_dispatch: isTestDispatch,
      timezone: attribution.timezone,
      attribution: attribution
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/telemetry', {
        method: 'POST',
        body: body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }
  }

  // 5. Session Start & Deep Engagement Timer (45s)
  function initSession() {
    trackEvent('session_start', { section: document.title || 'Home' });

    // Qualified deep engagement timer (45 seconds active dwell)
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        trackEvent('engaged_read', {
          section: currentSection,
          details: 'Qualified deep inspection (>=45s active presence)'
        });
      }
    }, 45000);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initSession);
  } else {
    initSession();
  }

  // 6. Periodic Keepalive Heartbeat (60s, D1 log only)
  setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      trackEvent('session_heartbeat', { section: currentSection });
    }
  }, 60000);

  // 7. Navigation & Section Tracking
  window.addEventListener('hashchange', () => {
    currentSection = window.location.hash || 'Home';
    trackEvent('section_view', { section: currentSection });
  });

  // 8. Scroll Depth Milestone Tracking (25%, 50%, 75%, 90%)
  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));

      const milestones = [25, 50, 75, 90];
      for (const m of milestones) {
        if (pct >= m && !trackedScrollMilestones.has(m)) {
          trackedScrollMilestones.add(m);
          trackEvent('scroll_milestone', {
            scroll_depth: m,
            details: `Scrolled to ${m}% of landing page`
          });
        }
      }
    }, 300);
  }, { passive: true });

  // 9. Interaction & Conversion Click Delegator (High Intent Actions)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, .tab-btn, .filter-pill, .pw-header, .gallery-item, .project-card, .btn-wd-card-action, .btn-hud-estimate, .btn-hud-call, .dock-btn-call, .dock-btn-photo, .dock-btn-estimate, .btn-hero-primary, .btn-hero-secondary, .drawer-chip, .gvsm-carousel-card, .slider-nav-arrow, .pw-quote-cta, #quote-btn, .submit-btn, .btn-submit-lead, .scrubber-btn, .nav-chip');
    if (!target) return;

    if (target.href && target.href.startsWith('tel:')) {
      trackEvent('intent_phone_dial', { details: target.href.replace('tel:', '') });
    } else if (target.href && target.href.startsWith('sms:')) {
      trackEvent('intent_sms_dispatch', { details: target.href.replace('sms:', '') });
    } else if (target.matches('.btn-hud-estimate, .dock-btn-estimate, .pw-quote-cta, #quote-btn, .submit-btn, .btn-submit-lead')) {
      trackEvent('intent_quote_cta', { details: target.innerText.trim() });
    } else if (target.matches('.drawer-chip')) {
      const chipText = target.innerText.trim();
      trackEvent('calc_scope_change', { trade: chipText, details: `Selected trade chip: ${chipText}` });
    } else if (target.matches('.gvsm-carousel-card')) {
      const slideTitle = target.querySelector('.gvsm-card-title')?.innerText || target.innerText;
      trackEvent('project_inspect', { project: slideTitle.trim(), details: `Selected GVSM showcase slide: ${slideTitle.trim()}` });
    } else if (target.matches('.slider-nav-arrow')) {
      trackEvent('photo_scrub', { details: `Navigated GVSM slider: ${target.innerText.trim()}` });
    } else if (target.matches('.tab-btn, .nav-chip')) {
      const label = target.querySelector('.tab-label') ? target.querySelector('.tab-label').innerText : target.innerText;
      currentSection = label.trim();
      trackEvent('section_view', { section: currentSection });
    } else if (target.matches('.filter-pill')) {
      trackEvent('gallery_inspect', { trade: target.innerText.trim(), details: 'Filtered trade gallery' });
    } else if (target.matches('.gallery-item')) {
      const caption = target.querySelector('.gallery-item-caption') ? target.querySelector('.gallery-item-caption').innerText : 'Photo Item';
      trackEvent('gallery_inspect', { details: caption.trim() });
    } else if (target.matches('.project-card')) {
      const title = target.querySelector('.project-title, .card-title, h3') ? target.querySelector('.project-title, .card-title, h3').innerText : 'Project Card';
      trackEvent('project_inspect', { project: title.trim(), details: `Inspected ${title.trim()}` });
    } else if (target.matches('.scrubber-btn')) {
      const parentCard = target.closest('.project-card, .showcase-card');
      const title = parentCard ? (parentCard.querySelector('.project-title, .card-title, h3')?.innerText || 'Project') : 'Project Showcase';
      trackEvent('photo_scrub', { project: title.trim(), details: `Scrubbed photo on ${title.trim()}` });
    } else if (target.matches('.pw-header')) {
      const title = target.querySelector('.pw-name') ? target.querySelector('.pw-name').innerText : 'Project Window';
      trackEvent('section_view', { details: `Project Modal: ${title.trim()}` });
    }
  });

  // 10. Contact Hesitation / Dwell Detection (Hovering on phone/intake > 3s)
  let contactHoverTimer = null;
  document.addEventListener('mouseover', (e) => {
    const contactTarget = e.target.closest('a[href^="tel:"], a[href^="sms:"], .contact-card, #quote-btn, .btn-hud-estimate');
    if (contactTarget && !contactHoverTimer) {
      contactHoverTimer = setTimeout(() => {
        trackEvent('contact_hesitation', {
          details: `Hovered over contact trigger for 3s (${contactTarget.innerText.trim() || 'Contact'})`
        });
        contactHoverTimer = null;
      }, 3000);
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (contactHoverTimer && e.target.closest('a[href^="tel:"], a[href^="sms:"], .contact-card, #quote-btn, .btn-hud-estimate')) {
      clearTimeout(contactHoverTimer);
      contactHoverTimer = null;
    }
  });

  // 11. Debounced Calculator Scope Adjustments
  let calcTimeout = null;
  window.trackCalculatorChange = function(trade, ballpark, params) {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => {
      trackEvent('calc_scope_change', {
        trade: trade || 'Concrete / PourReady',
        ballpark: ballpark || '',
        details: typeof params === 'object' ? JSON.stringify(params) : String(params)
      });
    }, 1200);
  };

  // 12. Form Field Engagement (Near-Miss Lead Detection)
  let formEngaged = false;
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select') && !formEngaged) {
      formEngaged = true;
      const form = e.target.closest('form');
      const formName = form ? (form.id || form.getAttribute('name') || 'Intake Form') : 'Input Field';
      trackEvent('form_engage', { details: `Started interacting with ${formName}` });
    }
  });

  // 13. Session Exit Dwell Logger
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('session_dwell', { details: 'Tab blurred or user navigated away' });
    }
  });
})();
