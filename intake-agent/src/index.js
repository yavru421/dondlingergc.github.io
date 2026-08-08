// src/index.js
export class ChatSession {
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }

    async fetch(request) {
        const { message } = await request.json();
        
        // Retrieve conversation history
        let history = await this.state.storage.get("history") || [];
        
        if (history.length === 0) {
            // Initialize system prompt based on 5 service buckets
            history.push({
                role: "system",
                content: `You are the Metropolis Intake Agent for Dondlinger GC. 
Your goal is to qualify leads into one of 5 buckets without being pushy:
1. Custom Construction/Trade Estimators
2. Aerial Reality Capture & Drone VFX
3. Zero-Latency Edge AI Business Agents
4. Stateless Web Apps (ZLA)
5. Parametric Engineering Automations

Always be concise, professional, and directly address the user's workflow headache. 
Once you have enough context about what they need, ask for their contact info to dispatch a bid. 
If they provide contact info, respond with "QUALIFIED_LEAD_CAPTURED" at the very end of your message.`
            });
        }

        history.push({ role: "user", content: message });

        // Call Workers AI Llama model
        const response = await this.env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
            messages: history,
            max_tokens: 500
        });

        const reply = response.response;
        history.push({ role: "assistant", content: reply });
        await this.state.storage.put("history", history);

        // Check if lead is qualified and trigger Telegram
        if (reply.includes("QUALIFIED_LEAD_CAPTURED")) {
            await this.dispatchTelegram(history);
        }

        // Send response back to the client (cleaning up the trigger flag)
        const cleanReply = reply.replace("QUALIFIED_LEAD_CAPTURED", "").trim();
        return new Response(JSON.stringify({ reply: cleanReply }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    async dispatchTelegram(history) {
        const token = this.env.TELEGRAM_BOT_TOKEN;
        const chatId = this.env.TELEGRAM_CHAT_ID;
        
        if (!token || !chatId) return; // Silent fail if no secrets

        // Summarize history for Telegram
        const summary = history
            .filter(m => m.role !== 'system')
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\\n\\n');

        const text = `🚨 NEW QUALIFIED LEAD 🚨\\n\\n${summary}`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text
            })
        });
    }
}

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            });
        }

        if (request.method !== "POST" || new URL(request.url).pathname !== "/api/chat") {
            return new Response("Not Found", { status: 404 });
        }

        const body = await request.clone().json();
        const sessionId = body.session_id || "default";

        // Route to Durable Object instance based on session ID
        const id = env.CHAT_SESSIONS.idFromName(sessionId);
        const stub = env.CHAT_SESSIONS.get(id);

        return await stub.fetch(request);
    }
};