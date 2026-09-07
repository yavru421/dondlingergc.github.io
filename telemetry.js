/**
 * dondlingergc.com — 2026 Unified Client Telemetry & Acquisition Engine
 * Standards: Zero-spurious spam, strict session attribution, canonical taxonomy.
 */
(function() {
  // 1. Session Persistence across page navigations in current tab
  let sid = sessionStorage.getItem('dgc_sid');
  if (!sid) {
    sid = 's_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
    sessionStorage.setItem('dgc_sid', sid);
  }

  const sessionStartTime = Date.now();
  let currentSection = document.title || 'Home';

  // 2. Extract & Cache Marketing Attribution Parameters
  function getAttribution() {
    let attr = null;
    try {
      const cached = sessionStorage.getItem('dgc_attr');
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    const params = new URLSearchParams(window.location.search);
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
      screen_res: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    try {
      sessionStorage.setItem('dgc_attr', JSON.stringify(attr));
    } catch (e) {}

    return attr;
  }

  const attribution = getAttribution();

  // 3. Core Dispatch Engine (sendBeacon with fetch keepalive fallback)
  function trackEvent(eventType, payload = {}) {
    const dwell = Math.round((Date.now() - sessionStartTime) / 1000);
    const body = JSON.stringify({
      sid: sid,
      event: eventType,
      section: payload.section || currentSection,
      trade: payload.trade || 'General',
      ballpark: payload.ballpark || '',
      details: payload.details || '',
      dwell_sec: dwell,
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

  // 4. Session Start & Engaged Reader Verification (4s)
  window.addEventListener('DOMContentLoaded', () => {
    trackEvent('session_start', { section: document.title || 'Home' });

    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        trackEvent('engaged_read', {
          section: currentSection,
          details: 'Human presence verified (>=4s dwell)'
        });
      }
    }, 4000);
  });

  // 5. Periodic Keepalive Heartbeat (30s)
  setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      trackEvent('session_heartbeat', { section: currentSection });
    }
  }, 30000);

  // 6. Navigation & Section Tracking (Hash changes & Popstate)
  window.addEventListener('hashchange', () => {
    currentSection = window.location.hash || 'Home';
    trackEvent('section_view', { section: currentSection });
  });

  // 7. Interaction & Conversion Click Delegator
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, .tab-btn, .filter-pill, .pw-header, .gallery-item, .btn-wd-card-action, .btn-hud-estimate, .pw-quote-cta, #quote-btn, .submit-btn');
    if (!target) return;

    if (target.href && target.href.startsWith('tel:')) {
      trackEvent('intent_phone_dial', { details: target.href.replace('tel:', '') });
    } else if (target.href && target.href.startsWith('sms:')) {
      trackEvent('intent_sms_dispatch', { details: target.href.replace('sms:', '') });
    } else if (target.matches('.btn-hud-estimate, .pw-quote-cta, #quote-btn, .submit-btn')) {
      trackEvent('intent_quote_cta', { details: target.innerText.trim() });
    } else if (target.matches('.tab-btn')) {
      const label = target.querySelector('.tab-label') ? target.querySelector('.tab-label').innerText : target.innerText;
      currentSection = label.trim();
      trackEvent('section_view', { section: currentSection });
    } else if (target.matches('.filter-pill')) {
      trackEvent('gallery_inspect', { trade: target.innerText.trim(), details: 'Filtered trade gallery' });
    } else if (target.matches('.gallery-item')) {
      const caption = target.querySelector('.gallery-item-caption') ? target.querySelector('.gallery-item-caption').innerText : 'Photo Item';
      trackEvent('gallery_inspect', { details: caption.trim() });
    } else if (target.matches('.pw-header')) {
      const title = target.querySelector('.pw-name') ? target.querySelector('.pw-name').innerText : 'Project Window';
      trackEvent('section_view', { details: `Project Modal: ${title.trim()}` });
    }
  });

  // 8. Debounced Calculator Scope Adjustments
  let calcTimeout = null;
  window.trackCalculatorChange = function(trade, ballpark, params) {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => {
      trackEvent('calc_scope_change', {
        trade: trade || 'Concrete / PourReady',
        ballpark: ballpark || '',
        details: typeof params === 'object' ? JSON.stringify(params) : String(params)
      });
    }, 600);
  };

  // 9. Session Exit Dwell Logger
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('session_dwell', { details: 'Tab blurred or user navigated away' });
    }
  });
})();
