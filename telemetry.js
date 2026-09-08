/**
 * dondlingergc.com — 2026 Unified Client Telemetry & Acquisition Engine
 * Standards: Zero-spurious spam, strict session attribution, operator suppression,
 * client-timezone hints, and high-intent qualified engagement gating.
 */
(function() {
  // 1. Operator Self-Traffic Detection (Prevents self-ping Telegram spam)
  const isOperatorParam = window.location.search.includes('operator=1') || window.location.search.includes('admin=1');
  if (isOperatorParam) {
    try {
      localStorage.setItem('dgc_operator', 'true');
      sessionStorage.setItem('dgc_operator', 'true');
    } catch (e) {}
  }
  const isOperator = (
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
      trade: payload.trade || 'General',
      ballpark: payload.ballpark || '',
      details: payload.details || '',
      dwell_sec: dwell,
      is_operator: isOperator,
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

  // 5. Session Start (D1 clickstream only) & Deep Engagement Timer (45s)
  // Low-level 4s bounces are eliminated to kill Telegram false-positive noise.
  window.addEventListener('DOMContentLoaded', () => {
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
  });

  // 6. Periodic Keepalive Heartbeat (60s, D1 log only)
  setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      trackEvent('session_heartbeat', { section: currentSection });
    }
  }, 60000);

  // 7. Navigation & Section Tracking (Hash changes & Popstate)
  window.addEventListener('hashchange', () => {
    currentSection = window.location.hash || 'Home';
    trackEvent('section_view', { section: currentSection });
  });

  // 8. Interaction & Conversion Click Delegator (High Intent Actions)
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

  // 9. Debounced Calculator Scope Adjustments (Only fires when user adjusts real dimensions)
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

  // 10. Session Exit Dwell Logger
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('session_dwell', { details: 'Tab blurred or user navigated away' });
    }
  });
})();
