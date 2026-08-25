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
    const device = ua.includes('iPhone') ? 'iPhone' : ua.includes('Android') ? 'Android' : 'Desktop';
    const sid = data.sid || (request.headers.get('cf-ray') ? request.headers.get('cf-ray').split('-')[0] : 'anon');

    // 1. ALWAYS Log Full Raw Clickstream Data into Cloudflare D1
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(sid, eventType, activeTab, trade, ballpark, dwell, device, cfCity, cfRegion).run().catch(console.error);
    }

    // 2. High-Filter Notification Rule:
    // ONLY send Telegram notification on NEW SESSION START ('page_view') or DIRECT CALL TAP
    // Silent for background clicks/drags to eliminate notification noise
    const isNewSession = (eventType === 'page_view');
    const isCallIntent = (eventType === 'call_button_click' || eventType === 'sms_button_click');

    if (isNewSession || isCallIntent) {
      const message = `${isCallIntent ? '📞 <b>INTENT: CALL/PHONE TAP</b>' : '🌐 <b>NEW VISITOR ARRIVED</b>'}\n\n` +
        `📍 <b>Location:</b> ${cfCity}, ${cfRegion}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `📄 <b>Landing Page:</b> <b>${activeTab}</b>\n` +
        `🆔 <code>${sid}</code>\n\n` +
        `<i>All clickstream events logged quietly to D1 database.</i>`;

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
