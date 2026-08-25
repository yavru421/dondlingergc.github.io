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
    
    // Dedicated Forum Topic Thread IDs (Default: 2 for Live Telemetry, 1 for Lead Direct Calls)
    const leadThreadId = env.TELEGRAM_LEAD_THREAD_ID ? parseInt(env.TELEGRAM_LEAD_THREAD_ID, 10) : 1;
    const telemetryThreadId = env.TELEGRAM_TELEMETRY_THREAD_ID ? parseInt(env.TELEGRAM_TELEMETRY_THREAD_ID, 10) : 2;

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

    // 1. Log to Cloudflare D1 if bound
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO visitor_traffic (sid, event_type, path, trade_viewed, ballpark_val, time_on_site_sec, device, city, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(sid, eventType, activeTab, trade, ballpark, dwell, device, cfCity, cfRegion).run().catch(console.error);
    }

    // 2. Dispatch to Telegram Thread 2 (Live Telemetry) or Thread 1 (Direct Call Intent)
    const isCallIntent = (eventType === 'call_button_click' || eventType === 'sms_button_click');
    const targetThreadId = isCallIntent ? leadThreadId : telemetryThreadId;

    let icon = '🛰️';
    if (eventType.includes('calc') || eventType.includes('estimate')) icon = '🧮';
    if (eventType.includes('gallery') || eventType.includes('zoom')) icon = '🖼️';
    if (eventType.includes('cta') || eventType.includes('tab')) icon = '👉';
    if (isCallIntent) icon = '📞';

    const message = `${icon} <b>${isCallIntent ? 'INTENT: PHONE/CALL TAP' : 'LIVE SITE ACTIVITY'}</b>\n\n` +
      `📍 <b>Location:</b> ${cfCity}, ${cfRegion}\n` +
      `🧭 <b>Action:</b> <code>${eventType}</code>\n` +
      `📄 <b>View/Tab:</b> <b>${activeTab}</b> (Trade: ${trade})\n` +
      (ballpark ? `💰 <b>Estimator Range:</b> ${ballpark}\n` : '') +
      (details ? `📝 <b>Context:</b> ${details}\n` : '') +
      `⏱️ <b>Dwell:</b> ${dwell}s | <b>Device:</b> ${device}\n` +
      `🆔 <code>${sid}</code>`;

    const tgPayload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (targetThreadId) tgPayload.message_thread_id = targetThreadId;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgPayload)
    }).catch(console.error);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
