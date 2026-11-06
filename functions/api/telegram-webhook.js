// Cloudflare Pages Function: /api/telegram-webhook
// Ingests replies from John Dondlinger (Owner) & Crew via Telegram and bridges them live into the client's web chat session.

const BOT_TOKEN = '7955190883:AAHKiXEGIjos0QOH2PHRW0N6i6A4lN7XW3E';
const PERSONAL_CHAT_ID = 8104595144; // John Dondlinger personal Telegram ID

async function initChatDb(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS dgc_chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_dgc_chat_session ON dgc_chat_messages(session_id, created_at)
    `).run();
  } catch (err) {
    console.warn('initChatDb notice:', err.message);
  }
}

async function saveMessage(db, msg) {
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO dgc_chat_messages (id, session_id, sender_role, sender_name, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(msg.id, msg.session_id, msg.sender_role, msg.sender_name, msg.message, msg.created_at).run();
      return true;
    } catch (e) {
      console.warn('DB write error in webhook:', e.message);
    }
  }
  return false;
}

export async function onRequest(context) {
  const { request, env } = context;
  const token = env.TELEGRAM_BOT_TOKEN || BOT_TOKEN;
  const db = env.DB || null;

  // 1. GET: Diagnostics or Webhook Self-Registration
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || url.searchParams.get('setup');

    if (action === 'setWebhook' || action === '1' || action === 'true') {
      const webhookUrl = 'https://dondlingergc.com/api/telegram-webhook';
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=${encodeURIComponent(JSON.stringify(['message','edited_message']))}`);
        const data = await res.json();
        return new Response(JSON.stringify({ status: 'setWebhook executed', result: data, webhookUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    try {
      const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const infoData = await infoRes.json();
      return new Response(JSON.stringify({ status: 'ready', webhookInfo: infoData }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // 2. POST: Inbound Telegram Webhook
  if (request.method === 'POST') {
    try {
      const update = await request.json();
      const message = update.message || update.edited_message;

      if (!message || !message.text) {
        return new Response(JSON.stringify({ ok: true, note: 'ignored non-text message' }), { status: 200 });
      }

      const text = message.text.trim();
      const from = message.from || {};
      const chatId = message.chat ? message.chat.id : null;
      const replyTo = message.reply_to_message;

      let targetSessionId = null;

      // Case A: Reply to an existing notification
      if (replyTo && replyTo.text) {
        const sidMatch = replyTo.text.match(/\[SID:([a-zA-Z0-9_-]+)\]/);
        if (sidMatch) {
          targetSessionId = sidMatch[1];
        }
      }

      // Case B: Explicit session syntax in message e.g. "/reply client_123 message" or "[SID:xyz]"
      if (!targetSessionId) {
        const sidInlineMatch = text.match(/(?:\[SID:|\/reply\s+)([a-zA-Z0-9_-]+)/);
        if (sidInlineMatch) {
          targetSessionId = sidInlineMatch[1];
        }
      }

      if (!targetSessionId) {
        // Not a reply to a client session; ignore gracefully
        return new Response(JSON.stringify({ ok: true, note: 'no target session found' }), { status: 200 });
      }

      // Clean command prefixes if present
      let cleanText = text;
      if (cleanText.startsWith('/reply')) {
        cleanText = cleanText.replace(/^\/reply\s+[a-zA-Z0-9_-]+\s*/, '');
      }

      // Determine sender identity
      const isOwner = (from.id === PERSONAL_CHAT_ID) || 
                      (from.username && from.username.toLowerCase() === 'snaptempo') ||
                      (from.first_name && from.first_name.toLowerCase().includes('john'));

      const senderRole = isOwner ? 'owner' : 'worker';
      const senderName = isOwner 
        ? 'John Dondlinger (Owner)' 
        : ((from.first_name || 'DGC Crew') + ' (Crew)');

      await initChatDb(db);

      const newMsg = {
        id: 'msg_tg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        session_id: targetSessionId,
        sender_role: senderRole,
        sender_name: senderName,
        message: cleanText,
        created_at: Date.now()
      };

      await saveMessage(db, newMsg);

      // Confirm to John in Telegram that his reply was sent to the client
      if (chatId) {
        try {
          const ackText = isOwner
            ? `🛡️ <b>Relayed live to client:</b>\n"<i>${escapeHtml(cleanText)}</i>"`
            : `👷 <b>Crew message relayed to client:</b>\n"<i>${escapeHtml(cleanText)}</i>"`;

          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              reply_to_message_id: message.message_id,
              text: ackText,
              parse_mode: 'HTML'
            })
          });
        } catch (ackErr) {
          console.warn('Telegram ack send error:', ackErr.message);
        }
      }

      return new Response(JSON.stringify({ ok: true, sessionId: targetSessionId, relayed: true }), { status: 200 });
    } catch (err) {
      console.error('Telegram webhook error:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
