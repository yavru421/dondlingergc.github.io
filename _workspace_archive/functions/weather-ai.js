const CORS_ORIGIN = 'https://dondlingergc.com';

const SYSTEM_PROMPT = `You are the Dondlinger Digital weather intelligence engine. You translate raw weather telemetry into direct, high-utility field verdicts for four specific personas: fishing (focusing on flow rate, moon, wind trends), lake (boating, wind gusts, safety), construction (OSHA wind limits, temperature limits for concrete pouring/safety), and family (outdoor play, UV safety, sunsets). 
Your output MUST be a valid JSON object matching this schema exactly:
{
  "emoji": "single emoji matching current condition",
  "label": "Short verdict label, e.g. Perfect Weather, High Wind Alert, Concrete Warning",
  "sub": "Under 12 words summary of current condition details",
  "color": "hex color code corresponding to hazard level (green #39ff14, info #38bdf8, warn #fbbf24, danger #ef4444)",
  "advice": "One sentence of direct, casual, field-oriented advice. Contractions OK. Zero corporate speak. Maximum utility.",
  "ai_forecast_narrative": "1-2 paragraphs of tactical, highly persona-specific forecasting for the next 3 days. Focus entirely on utility and actionable advice based on the provided forecast summary."
}
Keep answers concise, direct, and functional.`;

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Vary': 'Origin',
  };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const data = await request.json();
    const {
      mode = 'fishing',
      temperature = 'unknown',
      apparent_temperature = 'unknown',
      wind_speed = 'unknown',
      wind_gusts = 'unknown',
      weather_code = 0,
      uv_index = 0,
      river_flow = 'unknown',
      river_stage = 'unknown',
      forecast_summary = ''
    } = data;

    // Calculate a telemetry bucket hash key for KV caching
    const bucketTemp = typeof temperature === 'number' ? Math.round(temperature / 2) * 2 : 'N';
    const bucketAppart = typeof apparent_temperature === 'number' ? Math.round(apparent_temperature / 2) * 2 : 'N';
    const bucketWind = typeof wind_speed === 'number' ? Math.round(wind_speed / 5) * 5 : 'N';
    const bucketGust = typeof wind_gusts === 'number' ? Math.round(wind_gusts / 5) * 5 : 'N';
    const bucketUv = typeof uv_index === 'number' ? Math.round(uv_index) : 'N';
    const bucketFlow = typeof river_flow === 'number' ? Math.round(river_flow / 500) * 500 : 'N';
    const bucketStage = typeof river_stage === 'number' ? Math.round(river_stage * 2) / 2 : 'N';

    const cacheKey = `waz_ai_v2_${mode}_${bucketTemp}_${bucketWind}_${bucketGust}_${weather_code}`;

    // Try KV first
    let cachedVerdict = null;
    if (env.CRON_STATE) {
      try {
        cachedVerdict = await env.CRON_STATE.get(cacheKey);
      } catch (kvErr) {
        console.error('[weather-ai] KV read error:', kvErr);
      }
    }

    if (cachedVerdict) {
      return new Response(cachedVerdict, {
        headers: {
          ...corsHeaders,
          'X-Cache': 'HIT'
        }
      });
    }

    // Call Cloudflare Workers AI if no cache hit
    if (!env.AI) {
      throw new Error('Cloudflare AI binding is not configured');
    }

    const userPrompt = `Persona Mode: ${mode}
Telemetry: Temp ${temperature !== 'unknown' ? temperature + 'F' : 'unknown'}, Feels Like ${apparent_temperature !== 'unknown' ? apparent_temperature + 'F' : 'unknown'}, Wind Speed ${wind_speed !== 'unknown' ? wind_speed + 'mph' : 'unknown'}, Wind Gusts ${wind_gusts !== 'unknown' ? wind_gusts + 'mph' : 'unknown'}, Weather Code ${weather_code}, UV Index ${uv_index}, River Flow ${river_flow !== 'unknown' ? river_flow + 'cfs' : 'unknown'}, River Stage ${river_stage !== 'unknown' ? river_stage + 'ft' : 'unknown'}.
Forecast Summary: ${forecast_summary}`;

    const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      session_affinity: `waz-weather-${mode}`
    });

    let rawText = aiResponse?.response;
    if (!rawText && aiResponse?.result) {
      rawText = aiResponse.result;
    }

    // Basic validity check
    if (!rawText) {
      throw new Error('AI returned an empty response');
    }

    // Parse and stringify to ensure valid format and clean whitespace
    const parsed = JSON.parse(rawText);
    const cleanedText = JSON.stringify(parsed);

    // Save back to KV for future requests
    if (env.CRON_STATE) {
      try {
        // Cache for 15 minutes (900 seconds) to prevent quota burn on rapid refreshes while keeping advice fresh
        await env.CRON_STATE.put(cacheKey, cleanedText, { expirationTtl: 900 });
      } catch (kvErr) {
        console.error('[weather-ai] KV write error:', kvErr);
      }
    }

    return new Response(cleanedText, {
      headers: {
        ...corsHeaders,
        'X-Cache': 'MISS'
      }
    });

  } catch (err) {
    console.error('[weather-ai] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal AI service error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
