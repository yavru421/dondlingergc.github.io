// Cloudflare Pages Function: /api/transcribe
// High-Fidelity Cloudflare Workers AI Whisper Transcription Pipeline
// Tailored for Dondlinger General Contracting (DGC) Contractor Voice Intake

const CONTRACTOR_VOCABULARY_PROMPT = 
  "Dondlinger General Contracting (DGC), Central Wisconsin, general contractor construction intake: " +
  "LP SmartSide lap siding, cedar siding, board and batten, soffit, fascia, aluminum brake metal wrap, trim coil, " +
  "joists, rim joist, 2x4, 2x6, 2x8, 2x10, 2x12, subfloor, framing, rafters, trusses, OSB sheathing, Tyvek housewrap, " +
  "replacement windows, casement, double-hung, vinyl sliders, Low-E argon, sill pan flashing, door headers, interior trim, casing, " +
  "composite decking, Trex, TimberTech, pressure-treated, stringers, deck railing, balusters, footings, Sonotube, " +
  "PourReady concrete flatwork, yardage, slab, apron, rebar, wire mesh, stamped concrete, broom finish, " +
  "architectural shingles, underlayment, drip edge, ridge vent, ice and water shield, valleys, " +
  "drywall, Sheetrock, tape and mud, level 5 finish, acoustical drop ceiling, 2x2 grid, 2x4 Armstrong tiles, " +
  "kitchen remodel, cabinetry, countertops, square feet, linear feet.";

const BANNED_HALLUCINATIONS = [
  "thank you for watching",
  "thanks for watching",
  "please subscribe",
  "subscribe to our channel",
  "subtitles by",
  "transcript by",
  "translated by",
  "amara.org",
  "you're watching",
  "please like and subscribe",
  "see you next time",
  "the end.",
  "captioned by",
  "scribie.com",
  "copyright",
  "all rights reserved",
  "www.",
  "subtitles created by",
  "like and subscribe",
  "subtitles unavailable"
];

function cleanTranscript(text) {
  if (!text) return "";
  let clean = text.trim();
  if (clean.length === 0) return "";

  // Strip musical notes or descriptive brackets
  clean = clean.replace(/[♪♫♬♩]/g, "").trim();
  clean = clean.replace(/^[\(\[\{].*?[\)\]\}]$/g, "").trim();

  // Silence hallucination filter
  const lower = clean.toLowerCase();
  const stripped = lower.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "").replace(/\s+/g, " ").trim();
  if (BANNED_HALLUCINATIONS.some(p => stripped === p || stripped.startsWith(p + " ") || stripped.endsWith(" " + p))) {
    return "";
  }

  // Capitalize first letter
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  return clean;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Verify Cloudflare Workers AI binding availability
  if (!env || !env.AI) {
    return new Response(JSON.stringify({
      success: false,
      error: "Cloudflare Workers AI binding (env.AI) is not configured on this environment."
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let audioBuffer = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("audio") || formData.get("file") || formData.get("recording");
      if (file && typeof file.arrayBuffer === "function") {
        audioBuffer = await file.arrayBuffer();
      } else {
        // Search through all entries for any binary file
        for (const [key, val] of formData.entries()) {
          if (val && typeof val.arrayBuffer === "function" && val.size > 0) {
            audioBuffer = await val.arrayBuffer();
            break;
          }
        }
      }
    } else if (contentType.includes("application/json")) {
      const json = await request.json();
      const base64Data = json.audio || json.data || json.recording;
      if (typeof base64Data === "string") {
        const pureBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
        const binaryStr = atob(pureBase64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        audioBuffer = bytes.buffer;
      }
    } else {
      // Direct binary stream/payload (e.g. audio/webm, audio/wav, application/octet-stream)
      audioBuffer = await request.arrayBuffer();
    }

    if (!audioBuffer || audioBuffer.byteLength < 100) {
      return new Response(JSON.stringify({
        success: false,
        error: "No valid audio payload detected or audio buffer too small (<100 bytes)."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Workers AI expects an array of numbers representing binary bytes
    const audioArray = Array.from(new Uint8Array(audioBuffer));
    let modelUsed = "@cf/openai/whisper-large-v3-turbo";
    let response = null;

    // 1. Primary: Whisper Large v3 Turbo with contractor vocabulary biasing
    try {
      response = await Promise.race([
        env.AI.run("@cf/openai/whisper-large-v3-turbo", {
          audio: audioArray,
          initial_prompt: CONTRACTOR_VOCABULARY_PROMPT
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TURBO_TIMEOUT")), 9000))
      ]);
    } catch (turboErr) {
      console.warn("Whisper Large v3 Turbo error / timeout, falling back to Whisper base:", turboErr.message || turboErr);
      // 2. Fallback: Standard Whisper model
      modelUsed = "@cf/openai/whisper";
      try {
        response = await env.AI.run("@cf/openai/whisper", {
          audio: audioArray,
          initial_prompt: CONTRACTOR_VOCABULARY_PROMPT
        });
      } catch (fallbackErr) {
        console.error("Standard Whisper fallback failed:", fallbackErr.message || fallbackErr);
        throw fallbackErr;
      }
    }

    const rawText = response && (response.text || response.transcription) ? (response.text || response.transcription).trim() : "";
    const cleanText = cleanTranscript(rawText);

    return new Response(JSON.stringify({
      success: true,
      text: cleanText,
      raw: rawText,
      model: modelUsed,
      bytesReceived: audioBuffer.byteLength
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
      }
    });

  } catch (err) {
    console.error("Transcription execution error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Failed to transcribe audio stream."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
  });
}
