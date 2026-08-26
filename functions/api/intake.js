// Cloudflare Pages Function: /api/intake
// Direct Telegram Lead & Photo Dispatch Pipeline for Dondlinger General Contracting

export async function onRequestPost(context) {
  const { request, env } = context;

  // Retrieve Telegram bot token & chat ID from env or fallback to verified constants
  const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '8830044077:AAHuP_uOakAkEexOBnPkI0AkCOYS3My1SlU';
  const CHAT_ID = env.TELEGRAM_CHAT_ID || '8104595144';

  const contentType = request.headers.get('content-type') || '';
  let leadName = 'General Inquiry';
  let contact = 'Not provided';
  let service = 'General Scope';
  let city = 'Central Wisconsin';
  let notes = 'No additional notes';
  let photos = [];

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      leadName = formData.get('name') || leadName;
      contact = formData.get('contact') || formData.get('phone') || formData.get('email') || contact;
      service = formData.get('service') || service;
      city = formData.get('city') || city;
      notes = formData.get('notes') || formData.get('description') || notes;

      // Extract any photo files
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          photos.push(value);
        }
      }
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      leadName = json.name || leadName;
      contact = json.contact || json.phone || json.email || contact;
      service = json.service || service;
      city = json.city || city;
      notes = json.notes || json.description || notes;
    } else {
      const text = await request.text();
      notes = text || notes;
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const leadId = 'DGC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const telegramCaption = 
      `🚨 *NEW DGC CLIENT LEAD DISPATCH* 🚨\n\n` +
      `👤 *Client / Name:* ${leadName}\n` +
      `📞 *Contact:* \`${contact}\`\n` +
      `📍 *Location:* ${city}\n` +
      `🔨 *Scope / Service:* ${service}\n` +
      `📝 *Project Notes:* ${notes}\n\n` +
      `🕒 *Timestamp:* ${timestamp}\n` +
      `🆔 *Ref ID:* \`${leadId}\`\n` +
      `🌐 *Origin:* dondlingergc.com Intake Pipeline`;

    let telegramSuccess = false;
    let telegramResponse = null;

    if (photos.length > 0) {
      // Send first photo with full caption
      const primaryPhoto = photos[0];
      const photoFormData = new FormData();
      photoFormData.append('chat_id', CHAT_ID);
      photoFormData.append('caption', telegramCaption);
      photoFormData.append('parse_mode', 'Markdown');
      photoFormData.append('photo', primaryPhoto, primaryPhoto.name || 'intake_photo.jpg');

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: photoFormData
      });
      telegramResponse = await tgRes.json();
      telegramSuccess = telegramResponse.ok;

      // Send any additional photos
      for (let i = 1; i < photos.length; i++) {
        const extraPhoto = photos[i];
        const extraFormData = new FormData();
        extraFormData.append('chat_id', CHAT_ID);
        extraFormData.append('caption', `📷 Additional Photo (${i + 1}/${photos.length}) — Ref #${leadId}`);
        extraFormData.append('photo', extraPhoto, extraPhoto.name || `photo_${i}.jpg`);
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: extraFormData
        });
      }
    } else {
      // Text only dispatch
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: telegramCaption,
          parse_mode: 'Markdown'
        })
      });
      telegramResponse = await tgRes.json();
      telegramSuccess = telegramResponse.ok;
    }

    return new Response(JSON.stringify({
      success: true,
      lead_id: leadId,
      telegram_dispatched: telegramSuccess,
      photos_count: photos.length,
      message: 'Intake lead processed and forwarded to J. Dondlinger mobile dispatch.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Intake processing error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
