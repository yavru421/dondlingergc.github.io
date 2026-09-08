// Cloudflare Pages Function: /api/intake
// Universal Polymorphic Telegram Lead, Photo & Voice Audio Dispatch Pipeline for Dondlinger General Contracting

async function sendAudioToTelegram(token, chatId, audioFile, caption, threadId = null) {
  try {
    const ab = await audioFile.arrayBuffer();
    const mime = audioFile.type || 'audio/webm';
    const blob = new Blob([ab], { type: mime });
    const name = audioFile.name || 'voice_intake.webm';

    // 1. Primary attempt: sendVoice (rendered as native inline voice message in Telegram)
    try {
      const fd = new FormData();
      fd.append('chat_id', chatId);
      if (threadId) fd.append('message_thread_id', threadId);
      if (caption) fd.append('caption', caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption);
      fd.append('parse_mode', 'Markdown');
      fd.append('voice', blob, name);
      const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, { method: 'POST', body: fd });
      const json = await res.json();
      if (json.ok) return { ok: true, res: json };
    } catch (e) {
      console.warn('Telegram sendVoice attempt failed:', e);
    }

    // 2. Secondary attempt: sendAudio (rendered as playable audio track)
    try {
      const fd = new FormData();
      fd.append('chat_id', chatId);
      if (threadId) fd.append('message_thread_id', threadId);
      if (caption) fd.append('caption', caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption);
      fd.append('parse_mode', 'Markdown');
      fd.append('audio', blob, name);
      const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, { method: 'POST', body: fd });
      const json = await res.json();
      if (json.ok) return { ok: true, res: json };
    } catch (e) {
      console.warn('Telegram sendAudio attempt failed:', e);
    }

    // 3. Fallback attempt: sendDocument (guaranteed binary file delivery)
    const fd = new FormData();
    fd.append('chat_id', chatId);
    if (threadId) fd.append('message_thread_id', threadId);
    if (caption) fd.append('caption', caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption);
    fd.append('parse_mode', 'Markdown');
    fd.append('document', blob, name);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: fd });
    const json = await res.json();
    return { ok: json.ok, res: json };
  } catch (err) {
    console.error('Audio dispatch error:', err);
    return { ok: false, error: err.message };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Retrieve Telegram bot token & chat IDs strictly from environment secrets
  const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  const GROUP_CHAT_ID = env.TELEGRAM_GROUP_CHAT_ID || '-1004418238851'; // Intake_Supergroup_DondlingerGC
  const PERSONAL_CHAT_ID = env.TELEGRAM_CHAT_ID || '8104595144';

  const contentType = request.headers.get('content-type') || '';
  let leadName = 'General Inquiry';
  let contact = 'Not provided';
  let service = 'General Scope';
  let city = 'Central Wisconsin';
  let notes = 'No additional notes';
  let origin = 'dondlingergc.com';
  let photos = [];
  let voiceAudio = null;

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      leadName = formData.get('name') || leadName;
      contact = formData.get('contact') || formData.get('phone') || formData.get('email') || contact;
      service = formData.get('service') || formData.get('trade') || service;
      city = formData.get('city') || formData.get('address') || city;
      notes = formData.get('notes') || formData.get('description') || notes;
      origin = formData.get('origin') || origin;

      // Extract photos AND voice audio files across Cloudflare Workers runtime
      for (const [key, value] of formData.entries()) {
        const lowerKey = key.toLowerCase();
        const isVoiceKey = lowerKey.includes('voice') || lowerKey.includes('audio') || lowerKey.includes('recording') || lowerKey.includes('speech');
        const isPhotoKey = lowerKey.includes('photo') || lowerKey.includes('image') || lowerKey.includes('file');
        const hasBinaryPayload = value && typeof value === 'object' && (
          (typeof File !== 'undefined' && value instanceof File) ||
          (typeof Blob !== 'undefined' && value instanceof Blob) ||
          (typeof value.arrayBuffer === 'function' && typeof value.size === 'number' && value.size > 0)
        );

        if (hasBinaryPayload && value.size > 0) {
          if (isVoiceKey || (value.type && value.type.startsWith('audio/'))) {
            voiceAudio = value;
          } else {
            photos.push(value);
          }
        } else if (isVoiceKey && value && typeof value.arrayBuffer === 'function' && value.size > 0) {
          voiceAudio = value;
        } else if (isPhotoKey && value && typeof value.arrayBuffer === 'function' && value.size > 0) {
          photos.push(value);
        }
      }
    } else if (contentType.includes('application/json')) {
      const json = await request.json();

      // Handle nested VoiceIntake PWA payload ({ clientInfo, projectScope, timeline, keyRequirements, actionItems })
      if (json.clientInfo) {
        leadName = json.clientInfo.name || leadName;
        const contactParts = [json.clientInfo.phone, json.clientInfo.email, json.clientInfo.company].filter(Boolean);
        contact = contactParts.length > 0 ? contactParts.join(' • ') : contact;
      } else {
        leadName = json.name || leadName;
        contact = json.contact || json.phone || json.email || contact;
      }

      service = json.service || json.projectScope || (json.keyRequirements ? json.keyRequirements.join(', ') : service);
      city = json.city || json.address || (json.timeline ? `Timeline: ${json.timeline}` : city);
      origin = json.source || json.origin || 'voice-intake-app.dondlingergc.com';

      // Build rich Markdown notes if structured payload
      if (json.projectScope || json.keyRequirements) {
        const sections = [];
        if (json.estimatedBudget) sections.push(`💰 *Budget:* ${json.estimatedBudget}`);
        if (json.timeline) sections.push(`⏱️ *Timeline:* ${json.timeline}`);
        if (json.projectScope) sections.push(`📋 *Scope:* ${json.projectScope}`);
        if (json.keyRequirements && json.keyRequirements.length > 0) {
          sections.push(`📌 *Requirements:*\n• ${json.keyRequirements.join('\n• ')}`);
        }
        if (json.actionItems && json.actionItems.length > 0) {
          sections.push(`🎯 *Action Items:*\n• ${json.actionItems.join('\n• ')}`);
        }
        if (json.notes) sections.push(`📝 *Additional Notes:* ${json.notes}`);
        notes = sections.join('\n\n');
      } else {
        notes = json.notes || json.description || notes;
      }

      // Support base64 photos if passed in JSON
      if (Array.isArray(json.photos)) {
        for (const p of json.photos) {
          if (p.data && p.data.startsWith('data:image')) {
            const parts = p.data.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const byteString = atob(parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mime });
            photos.push(new File([blob], p.name || 'photo.jpg', { type: mime }));
          }
        }
      }

      // Support base64 voice audio if passed in JSON
      if (json.voice || json.audio) {
        const voiceData = json.voice || json.audio;
        if (typeof voiceData === 'string' && voiceData.includes(',')) {
          const parts = voiceData.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/webm';
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          const blob = new Blob([ab], { type: mime });
          voiceAudio = new File([blob], json.voiceName || 'voice_memo.webm', { type: mime });
        }
      }
    } else {
      const text = await request.text();
      notes = text || notes;
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const leadId = 'DGC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const tagLead = '#' + leadId.replace(/-/g, '_');

    const telegramMessage = 
      `🚨 *NEW CLIENT INTAKE DISPATCH* 🚨\n\n` +
      `👤 *Client:* ${leadName}\n` +
      `📞 *Contact:* \`${contact}\`\n` +
      `📍 *Location / Timeline:* ${city}\n` +
      `🔨 *Primary Trade / Service:* ${typeof service === 'string' && service.length > 80 ? service.substring(0, 80) + '...' : service}\n\n` +
      `📝 *Scope & Requirements:*\n${notes}\n\n` +
      `🎙️ *Voice Memo:* ${voiceAudio ? 'Attached (Playable below)' : 'None'}\n` +
      `🕒 *Timestamp:* ${timestamp}\n` +
      `🆔 *Ref ID:* \`${leadId}\`  ${tagLead}\n` +
      `🌐 *Origin:* \`${origin}\``;

    let telegramSuccess = false;
    let telegramResponse = null;
    let threadId = null;

    const candidateTokens = [BOT_TOKEN].filter(Boolean);

    // Step 1: Attempt to spawn a dedicated Telegram Forum Topic Thread for this lead in the supergroup
    const cleanLead = (leadName && leadName !== 'General Inquiry' && leadName !== 'Hero Photo Quote')
      ? leadName
      : (contact && contact !== 'Not provided' ? contact : 'Direct Intake');
    const topicTitle = `🏗️ ${cleanLead} — Ref #${leadId}`;

    for (const token of candidateTokens) {
      try {
        const topicRes = await fetch(`https://api.telegram.org/bot${token}/createForumTopic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: GROUP_CHAT_ID,
            name: topicTitle.substring(0, 128)
          })
        });
        const topicJson = await topicRes.json();
        if (topicJson.ok && topicJson.result && topicJson.result.message_thread_id) {
          threadId = topicJson.result.message_thread_id;
          break;
        }
      } catch (tErr) {
        console.warn('Telegram createForumTopic attempt failed:', tErr);
      }
    }

    const targetChatId = GROUP_CHAT_ID;

    // Step 2: Dispatch Attached Photos into the supergroup forum thread
    if (photos.length > 0) {
      for (const token of candidateTokens) {
        try {
          const primaryPhoto = photos[0];
          const primaryBuffer = await primaryPhoto.arrayBuffer();
          const primaryBlob = new Blob([primaryBuffer], { type: primaryPhoto.type || 'image/jpeg' });
          const primaryName = primaryPhoto.name || 'intake_photo_1.jpg';

          // First attempt: with Markdown caption
          let photoFormData = new FormData();
          photoFormData.append('chat_id', targetChatId);
          if (threadId) photoFormData.append('message_thread_id', threadId);
          photoFormData.append('caption', telegramMessage.length > 1024 ? telegramMessage.substring(0, 1020) + '...' : telegramMessage);
          photoFormData.append('parse_mode', 'Markdown');
          photoFormData.append('photo', primaryBlob, primaryName);

          let tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: photoFormData
          });
          telegramResponse = await tgRes.json();

          // Fallback attempt: plain text caption
          if (!telegramResponse.ok) {
            photoFormData = new FormData();
            photoFormData.append('chat_id', targetChatId);
            if (threadId) photoFormData.append('message_thread_id', threadId);
            const plainCaption = telegramMessage.replace(/[*`_]/g, '');
            photoFormData.append('caption', plainCaption.length > 1024 ? plainCaption.substring(0, 1020) + '...' : plainCaption);
            photoFormData.append('photo', primaryBlob, primaryName);

            tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              body: photoFormData
            });
            telegramResponse = await tgRes.json();
          }

          // Fallback to personal chat if group dispatch was rejected
          if (!telegramResponse.ok && targetChatId !== PERSONAL_CHAT_ID) {
            photoFormData = new FormData();
            photoFormData.append('chat_id', PERSONAL_CHAT_ID);
            photoFormData.append('caption', telegramMessage.length > 1024 ? telegramMessage.substring(0, 1020) + '...' : telegramMessage);
            photoFormData.append('photo', primaryBlob, primaryName);

            tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
              method: 'POST',
              body: photoFormData
            });
            telegramResponse = await tgRes.json();
          }

          if (telegramResponse.ok) {
            telegramSuccess = true;
            // Send remaining photos sequentially
            for (let i = 1; i < photos.length; i++) {
              try {
                const extraPhoto = photos[i];
                const extraBuffer = await extraPhoto.arrayBuffer();
                const extraBlob = new Blob([extraBuffer], { type: extraPhoto.type || 'image/jpeg' });
                const extraName = extraPhoto.name || `photo_${i + 1}.jpg`;

                const extraFormData = new FormData();
                extraFormData.append('chat_id', targetChatId);
                if (threadId) extraFormData.append('message_thread_id', threadId);
                extraFormData.append('caption', `📷 Additional Photo (${i + 1}/${photos.length}) — Ref: ${leadId}`);
                extraFormData.append('photo', extraBlob, extraName);

                await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                  method: 'POST',
                  body: extraFormData
                });
              } catch (err) {
                console.error('Error dispatching extra photo:', err);
              }
            }

            // If voice audio is present alongside photos, dispatch voice memo directly into the topic thread
            if (voiceAudio) {
              const audioCaption = `🎙️ *Client Voice Intake Memo* — Ref: \`${leadId}\` (${leadName})`;
              await sendAudioToTelegram(token, targetChatId, voiceAudio, audioCaption, threadId);
            }

            break;
          }
        } catch (e) {
          telegramResponse = { error: e.message };
        }
      }
    }

    // Step 3: If no photos attached but voice audio IS present, dispatch voice directly into the topic thread
    if (!telegramSuccess && voiceAudio) {
      for (const token of candidateTokens) {
        try {
          const audioRes = await sendAudioToTelegram(token, targetChatId, voiceAudio, telegramMessage, threadId);
          if (audioRes.ok) {
            telegramSuccess = true;
            telegramResponse = audioRes.res;
            break;
          } else if (targetChatId !== PERSONAL_CHAT_ID) {
            const fallbackRes = await sendAudioToTelegram(token, PERSONAL_CHAT_ID, voiceAudio, telegramMessage, null);
            if (fallbackRes.ok) {
              telegramSuccess = true;
              telegramResponse = fallbackRes.res;
              break;
            }
          }
        } catch (e) {
          telegramResponse = { error: e.message };
        }
      }
    }

    // Step 4: Fallback text message if photos & voice failed or were absent
    if (!telegramSuccess) {
      const attachmentsNotice = (photos.length > 0 || voiceAudio)
        ? `\n\n⚠️ *Notice:* Attachments (${photos.length} photo(s), ${voiceAudio ? '1 voice memo' : '0 audio'}) were submitted but media dispatch failed.`
        : '';
      const fullTextMessage = telegramMessage + attachmentsNotice;

      for (const token of candidateTokens) {
        try {
          const bodyPayload = {
            chat_id: targetChatId,
            text: fullTextMessage,
            parse_mode: 'Markdown'
          };
          if (threadId) bodyPayload.message_thread_id = threadId;

          const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });
          telegramResponse = await tgRes.json();
          if (telegramResponse.ok) {
            telegramSuccess = true;
            break;
          } else {
            // Unescaped retry
            bodyPayload.text = fullTextMessage.replace(/[*`_]/g, '');
            delete bodyPayload.parse_mode;
            const rawRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload)
            });
            const rawJson = await rawRes.json();
            if (rawJson.ok) {
              telegramSuccess = true;
              telegramResponse = rawJson;
              break;
            } else if (targetChatId !== PERSONAL_CHAT_ID) {
              // Direct fallback to personal chat
              const dmRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: PERSONAL_CHAT_ID, text: fullTextMessage.replace(/[*`_]/g, '') })
              });
              const dmJson = await dmRes.json();
              if (dmJson.ok) {
                telegramSuccess = true;
                telegramResponse = dmJson;
                break;
              }
            }
          }
        } catch (e) {
          telegramResponse = { error: e.message };
        }
      }
    }

    const threadUrl = threadId ? `https://t.me/c/4418238851/${threadId}` : null;

    // Step 5: Mirror notification to personal chat so John gets immediate mobile notification with direct 1-tap topic link
    if (telegramSuccess && targetChatId !== PERSONAL_CHAT_ID) {
      try {
        const mirrorText = `🔔 *New Intake Lead Dispatch* [\`${leadId}\`]\n` +
          `👤 *Client:* ${leadName}\n` +
          `📞 *Contact:* \`${contact}\`\n` +
          `🔨 *Scope:* ${typeof service === 'string' && service.length > 60 ? service.substring(0, 60) + '...' : service}\n` +
          (threadUrl ? `🧵 *Topic Thread:* [Open #${leadId} in Telegram](${threadUrl})` : `💬 *Supergroup Channel:* Posted in main feed`);

        await fetch(`https://api.telegram.org/bot${candidateTokens[0]}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: PERSONAL_CHAT_ID,
            text: mirrorText,
            parse_mode: 'Markdown'
          })
        });
      } catch (mErr) {
        console.warn('Personal chat mirror notice failed:', mErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      lead_id: leadId,
      thread_id: threadId,
      thread_url: threadUrl,
      telegram_dispatched: telegramSuccess,
      photos_count: photos.length,
      has_voice_audio: !!voiceAudio,
      message: 'Intake lead processed and forwarded to J. Dondlinger mobile dispatch.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
}
