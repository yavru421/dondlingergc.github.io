export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ status: 'ready' }), { status: 200, headers: corsHeaders });

  try {
    const data = await request.json().catch(() => ({}));
    const botToken = env.TELEGRAM_BOT_TOKEN || '7955190883:AAFUBoUU65F4v52ApOYNT0c5ZRCPEFjoLBY';
    const chatId = env.TELEGRAM_CHAT_ID || '8104595144';

    const eventType = data.event || 'interaction';
    const activeTab = data.tab || data.active_tab || 'Home';
    const trade = data.trade || 'General';
    const details = data.details || '';
    const ballpark = data.ballpark || '';
    const dwell = data.dwell_sec || 0;
    const cfCity = request.cf?.city || 'Central Wisconsin';
    const cfRegion = request.cf?.region || 'WI';
    const ua = request.headers.get('user-agent') || '';

    // 1. Bot / Crawler / Port Scanner Filter
    const isBot = /bot|crawl|spider|slurp|censys|shodan|masscan|bytespider|gptbot|claudebot|headless|python-requests|aiohttp|wget|curl/i.test(ua);
    if (isBot) {
      // Silently log or ignore bot probes - NEVER trigger Telegram alerts
      return new Response(JSON.stringify({ success: true, bot: true }), { status: 200, headers: corsHeaders });
    }

    const device = ua.includes('iPhone') ? 'iPhone' : ua.includes('Android') ? 'Android' : 'Desktop';
    const sid = data.sid || (request.headers.get('cf-ray') ? request.headers.get('cf-ray').split('-')[0] : 'anon');

    // 2. ALWAYS Log Full Raw Clickstream Data into Cloudflare D1
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(sid, eventType, activeTab, trade, ballpark, dwell, device, cfCity, cfRegion).run().catch(console.error);
    }

    // 3. Human Engagement Gating for Telegram Alerts:
    // Suppress instant 0-second page_view bounces.
    // ONLY alert on Telegram on:
    // a) Direct phone/SMS click
    // b) Estimate CTA click
    // c) Verified human dwell time >= 4s ('engaged_read')
    // d) High-intent interactive exploration (gallery views, tab switches)
    const isCallIntent = (eventType === 'call_button_click' || eventType === 'sms_button_click');
    const isCtaIntent = (eventType === 'cta_estimate_click');
    const isEngagedDwell = (eventType === 'engaged_read' || eventType === 'session_dwell') && dwell >= 4;
    const isExploration = (eventType === 'tab_switch' || eventType === 'gallery_photo_view' || eventType === 'calc_estimate_adjust');

    if (isCallIntent || isCtaIntent || isEngagedDwell || isExploration) {
      let headerIcon = '🌐 <b>LIVE HUMAN VISITOR</b>';
      if (isCallIntent) headerIcon = '📞 <b>HIGH INTENT: PHONE / SMS TAP</b>';
      else if (isCtaIntent) headerIcon = '📝 <b>HIGH INTENT: ESTIMATE CTA CLICK</b>';
      else if (isExploration) headerIcon = '🔍 <b>ENGAGED INTERACTION</b>';

      const message = `${headerIcon}\n\n` +
        `📍 <b>Location:</b> ${cfCity}, ${cfRegion}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `📄 <b>Active Section:</b> <b>${activeTab}</b>\n` +
        (dwell > 0 ? `⏱️ <b>Time on Site:</b> ${dwell}s\n` : '') +
        (details ? `📌 <b>Detail:</b> ${details}\n` : '') +
        `🆔 <code>${sid}</code>\n\n` +
        `<i>Filtered telemetry (bot probes suppressed).</i>`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      }).catch(console.error);
    }

    return new Response(JSON.stringify({ success: true, logged_to_d1: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
