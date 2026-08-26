(function() {
  const sid = 's_' + Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();
  let currentTab = document.title || 'Home';

  function trackEvent(eventType, payload = {}) {
    const dwell = Math.round((Date.now() - startTime) / 1000);
    const body = JSON.stringify({
      sid: sid,
      event: eventType,
      tab: payload.tab || currentTab,
      trade: payload.trade || 'General',
      ballpark: payload.ballpark || '',
      details: payload.details || '',
      dwell_sec: dwell
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/telemetry', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  }

  // 1. Initial Page View Beacon (Raw D1 log) & Engaged Reader Timer (4s)
  window.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view', { tab: document.title || 'Home' });

    // After 4s of active presence, dispatch engaged_read beacon
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        trackEvent('engaged_read', { tab: currentTab, details: 'Active reading session >= 4s' });
      }
    }, 4000);
  });

  // 2. Track Hash Navigation / Tabs
  window.addEventListener('hashchange', () => {
    currentTab = window.location.hash || 'Home';
    trackEvent('tab_navigation', { tab: currentTab });
  });

  // 3. Track High-Intent Clicks (Phone, SMS, CTAs, Gallery, Tabs)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button, .tab-btn, .filter-pill, .pw-header, .gallery-item, .btn-wd-card-action');
    if (!target) return;

    if (target.href && target.href.startsWith('tel:')) {
      trackEvent('call_button_click', { details: target.href });
    } else if (target.href && target.href.startsWith('sms:')) {
      trackEvent('sms_button_click', { details: target.href });
    } else if (target.matches('.btn-hud-estimate, .pw-quote-cta, #quote-btn, .submit-btn')) {
      trackEvent('cta_estimate_click', { details: target.innerText.trim() });
    } else if (target.matches('.tab-btn')) {
      const label = target.querySelector('.tab-label') ? target.querySelector('.tab-label').innerText : target.innerText;
      trackEvent('tab_switch', { tab: label.trim() });
    } else if (target.matches('.filter-pill')) {
      trackEvent('gallery_filter', { trade: target.innerText.trim() });
    } else if (target.matches('.gallery-item')) {
      const caption = target.querySelector('.gallery-item-caption') ? target.querySelector('.gallery-item-caption').innerText : 'Photo Item';
      trackEvent('gallery_photo_view', { details: caption.trim() });
    } else if (target.matches('.pw-header')) {
      const title = target.querySelector('.pw-name') ? target.querySelector('.pw-name').innerText : 'Project Window';
      trackEvent('project_window_toggle', { details: title.trim() });
    }
  });

  // 4. Track Calculator Estimator Adjustments (Debounced)
  let calcTimeout = null;
  window.trackCalculatorChange = function(trade, ballpark, params) {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => {
      trackEvent('calc_estimate_adjust', {
        trade: trade || 'Concrete / PourReady',
        ballpark: ballpark || '',
        details: typeof params === 'object' ? JSON.stringify(params) : String(params)
      });
    }, 600);
  };

  // 5. Visibility / Dwell Time on Exit
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('session_dwell', { details: 'Visitor switched tab or navigated away' });
    }
  });
})();
