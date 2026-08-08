export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const systemPrompt = `You are the Dondlinger Digital Assistant, an AI embedded in the dondlingergc.com landing page.
Your job is to help users discover and understand our suite of premium applications and protocols:
- WaZ Weather: Blazor WASM real-time atmospheric telemetry dashboard.
- TAP Protocol: Targeted Acquisition Protocol, premium MudBlazor WASM client for secure enterprise interactions.
- Skydrop: Ultra-secure file transfer service using PeerJS and WebRTC for ZLA (Zero-Liability Architecture) direct client-to-client sharing with QR Code scanning.
- OMW (On My Way): App for rapid location and status updates.
- TimelineZLA: Core ZLA engine for state management.
- ZLA (Zero-Liability Architecture): Our core engineering philosophy where encryption keys stay on the client device, ensuring privacy and zero data liability.
Keep responses concise, modern, and highly relevant to the Dondlinger ecosystem. Use markdown for bolding key terms.`;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    return new Response(JSON.stringify({ reply: response.response }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
