// Cloudflare Pages Function: /api/chat
// 3-Way Live Dispatch Chat: Client (Web) <-> Worker (Cloudflare AI / Crew) <-> Owner (John Dondlinger via Telegram)

const BOT_TOKEN = '7955190883:AAHKiXEGIjos0QOH2PHRW0N6i6A4lN7XW3E';
const GROUP_CHAT_ID = '-1004418238851'; // Intake_Supergroup_DondlingerGC
const PERSONAL_CHAT_ID = '8104595144'; // John Dondlinger personal Telegram

// In-memory fallback if D1 table is initializing or temporarily unavailable
const MEMORY_SESSIONS = new Map();

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
      return;
    } catch (e) {
      console.warn('DB write error, using memory fallback:', e.message);
    }
  }

  // Fallback to in-memory store
  if (!MEMORY_SESSIONS.has(msg.session_id)) {
    MEMORY_SESSIONS.set(msg.session_id, []);
  }
  const arr = MEMORY_SESSIONS.get(msg.session_id);
  arr.push(msg);
  if (arr.length > 50) arr.shift();
}

async function getMessages(db, sessionId, afterTimestamp = 0) {
  if (db) {
    try {
      const res = await db.prepare(`
        SELECT id, session_id, sender_role, sender_name, message, created_at
        FROM dgc_chat_messages
        WHERE session_id = ? AND created_at > ?
        ORDER BY created_at ASC
      `).bind(sessionId, afterTimestamp).all();
      if (res && res.results) {
        return res.results;
      }
    } catch (e) {
      console.warn('DB read error, using memory fallback:', e.message);
    }
  }

  const arr = MEMORY_SESSIONS.get(sessionId) || [];
  return arr.filter(m => m.created_at > afterTimestamp);
}

async function sendTelegramAlert(token, text, replyMarkup = null) {
  const targets = [PERSONAL_CHAT_ID, GROUP_CHAT_ID];
  const promises = targets.map(async chatId => {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn(`Telegram dispatch to ${chatId} failed:`, err.message);
    }
  });

  await Promise.allSettled(promises);
}

export async function onRequest(context) {
  const { request, env } = context;
  const token = env.TELEGRAM_BOT_TOKEN || BOT_TOKEN;
  const db = env.DB || null;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  await initChatDb(db);

  // 1. GET: Poll messages for a session
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const after = parseInt(url.searchParams.get('after') || '0', 10);

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400, headers: corsHeaders });
    }

    const messages = await getMessages(db, sessionId, after);
    return new Response(JSON.stringify({ sessionId, messages }), { headers: corsHeaders });
  }

  // 2. POST: New message from Client
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const sessionId = body.sessionId || ('client_' + Math.random().toString(36).substring(2, 9));
      const clientName = body.name || 'Website Visitor';
      const contactInfo = body.contact || '';
      const text = (body.message || '').trim();

      if (!text) {
        return new Response(JSON.stringify({ error: 'Message cannot be empty' }), { status: 400, headers: corsHeaders });
      }

      const clientMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        session_id: sessionId,
        sender_role: 'client',
        sender_name: clientName,
        message: text,
        created_at: Date.now()
      };
      await saveMessage(db, clientMsg);

      // Dispatch alert to Telegram
      const tgText = `💬 <b>LIVE 3-WAY CHAT INQUIRY</b>\n` +
        `<code>[SID:${sessionId}]</code>\n` +
        `👤 <b>Client:</b> ${escapeHtml(clientName)} ${contactInfo ? `(<code>${escapeHtml(contactInfo)}</code>)` : ''}\n` +
        `📝 <b>Message:</b> "${escapeHtml(text)}"\n\n` +
        `👉 <i>Reply directly to this Telegram message to chime in as John Dondlinger (Owner).</i>`;

      await sendTelegramAlert(token, tgText);

      // Worker Dispatch Reply (Automated 1st responder while owner is alerted)
      let workerReplyText = '';
      if (env.AI) {
        try {
          const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
            messages: [
              {
                role: 'system',
                content: `You are the lead field estimator & dispatch worker for Dondlinger General Contracting LLC in Central Wisconsin (Wisconsin Rapids, Stevens Point, Plover, Wood & Portage Counties).
Owner: John Dondlinger (licensed dwelling contractor).
Trades: 4,000 PSI concrete flatwork (hand-tooled joints, zero saw cuts), structural framing & additions, custom decks/stairs, Level 4/5 drywall/soffits, remodels, siding/windows.
Respond concisely in 1-2 friendly, professional sentences. Acknowledge their message, ask for their project location/city or dimensions if not provided, and inform them that John Dondlinger has been paged directly on his phone and can chime into this chat live.`
              },
              {
                role: 'user',
                content: `Client Name: ${clientName}. Inquiry: ${text}`
              }
            ]
          });
          workerReplyText = (aiResponse && aiResponse.response) ? aiResponse.response.trim() : '';
        } catch (aiErr) {
          console.warn('Workers AI triage error:', aiErr.message);
        }
      }

      if (!workerReplyText) {
        workerReplyText = `Thanks for reaching out! I've paged John Dondlinger directly on his phone with your note. What town or address in Central Wisconsin is your project located in?`;
      }

      const workerMsg = {
        id: 'msg_' + (Date.now() + 1) + '_' + Math.random().toString(36).substring(2, 6),
        session_id: sessionId,
        sender_role: 'worker',
        sender_name: 'DGC Dispatch (Worker)',
        message: workerReplyText,
        created_at: Date.now() + 1
      };
      await saveMessage(db, workerMsg);

      // Notify Telegram of the worker's reply
      const tgWorkerLog = `👷 <b>DGC Dispatch replied to client:</b>\n` +
        `<code>[SID:${sessionId}]</code>\n` +
        `"${escapeHtml(workerReplyText)}"`;
      await sendTelegramAlert(token, tgWorkerLog);

      const allMessages = await getMessages(db, sessionId, 0);
      return new Response(JSON.stringify({ sessionId, messages: allMessages }), { headers: corsHeaders });
    } catch (err) {
      console.error('Chat POST error:', err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
