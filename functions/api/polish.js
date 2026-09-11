// Cloudflare Pages Function: /api/polish
// AI Scope Clarifier & Project Expander for Dondlinger General Contracting
// Zero-Liability Architecture (ZLA) Hardened Endpoint

const SYSTEM_PROMPT = `You are the Technical Scope Assistant for Dondlinger General Contracting (DGC) in Wisconsin Rapids, Central Wisconsin.
Your sole job is to take a homeowner's raw, rambling voice transcription or informal project notes and organize them into clean, practical contractor checklist points for John Dondlinger's upcoming on-site review.

STRICT ZERO-LIABILITY RULES (MANDATORY):
1. NEVER output any dollar amounts, cost ranges, hourly rates, or pricing estimates.
2. NEVER guarantee building code compliance or claim whether a project is permit-exempt.
3. NEVER make structural guarantees (e.g. do not say framing or footings are definitely reusable).
4. Tone must be down-to-earth, respectful, and practical (Midwestern contractor style). Avoid flowery, pretentious architectural jargon.
5. Format your output into exactly these 4 clean sections with concise bullet points:
   • Primary Problem & Space: (Clear description of what is happening and where)
   • On-Site Inspection Checklist: (Items John will examine on-site: sills, moisture, flashing, framing, rot)
   • Material & Finish Possibilities: (Sensible, durable options: vinyl vs fiberglass, LP SmartSide, composite trim)
   • Helpful Questions for John: (1-2 practical questions the homeowner can ask John during the walkthrough)

End with this exact line:
[Preliminary scope notes for John Dondlinger's on-site verification]`;

function sanitizeEdgeOutput(text) {
  if (!text) return "";
  return text
    .replace(/\$\s*[\d,]+(\.\d{2})?(\s*-\s*\$?[\d,]+(\.\d{2})?)?/gi, "[Cost determined on-site]")
    .replace(/(no\s+permit\s+required|permits?\s+exempt|guaranteed\s+code\s+compliant)/gi, "[Permit status verified on-site]");
}

export async function onRequestPost(context) {
  const { request, env } = context;

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
    const json = await request.json().catch(() => ({}));
    const rawNotes = (json.text || json.notes || "").trim();
    const serviceContext = json.service || "General Contracting";

    if (!rawNotes || rawNotes.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: "Please provide more details in your project notes before organizing."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const userPrompt = `Homeowner's raw project description:\n"${rawNotes}"\n\nSelected trade category: ${serviceContext}\n\nPlease organize and clarify this into the 4 required scope sections:`;

    let response = null;
    let modelUsed = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

    try {
      response = await Promise.race([
        env.AI.run(modelUsed, {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 650,
          temperature: 0.3
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("LLAMA_TIMEOUT")), 12000))
      ]);
    } catch (e) {
      console.warn("Llama-3.3 70B fallback to Llama-3.1 8B:", e.message || e);
      modelUsed = "@cf/meta/llama-3.1-8b-instruct";
      response = await env.AI.run(modelUsed, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 650,
        temperature: 0.3
      });
    }

    const rawOutput = response && (response.response || response.text || "");
    const cleanOutput = sanitizeEdgeOutput(rawOutput.trim());

    return new Response(JSON.stringify({
      success: true,
      polished_scope: cleanOutput,
      polishedScope: cleanOutput,
      model: modelUsed,
      original_length: rawNotes.length
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
    console.error("Scope polishing error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Failed to clarify project scope."
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
