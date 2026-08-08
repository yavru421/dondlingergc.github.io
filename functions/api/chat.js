export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.json();
        const userMessage = body.message;
        const sessionId = body.session_id;

        if (!userMessage) {
            return new Response(JSON.stringify({ error: "Missing message" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" } 
            });
        }

        const systemPrompt = `You are the Metropolis Neural Oracle 20Q, a high-end, blunt B2B Intake Engine for DondlingerGC.
Your goal is to qualify the user's workflow headache and propose a Zero-Liability Architecture (ZLA) software solution.
Keep your responses short, professional, and brutally pragmatic. Ask 1 qualifying question at a time.
Do not use generic AI fluff or apologize. You are a principal systems architect.`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ];

        // Call the Cloudflare Workers AI binding using Llama 3.2
        const aiResponse = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
            messages: messages
        });

        return new Response(JSON.stringify({ 
            reply: aiResponse.response,
            session_id: sessionId
        }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (e) {
        return new Response(JSON.stringify({ 
            error: "Neural Oracle Offline. MetroNode routing failed.", 
            details: e.message 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
        });
    }
}
