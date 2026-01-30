export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('sessionId') || 'default';

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Use KV if available, else mock it
    const storage = env.COMMANDS_KV || {
        async get(key) { return null; },
        async put(key, val) { return; }
    };

    try {
        switch (action) {
            case 'push': // From Mobile/Agent to Desktop
                if (request.method !== 'POST') break;
                const command = await request.json();
                const cmdId = Date.now();

                // Handle file uploads separately - store with longer TTL and file-specific key
                if (command.type === 'file_upload' && command.file) {
                    // Store file under main key (will be retrieved by pull and deleted)
                    // Also store timestamped backup for queuing
                    const fileData = {
                        ...command,
                        id: cmdId,
                        timestamp: cmdId
                    };
                    await storage.put(`file_${sessionId}`, JSON.stringify(fileData), { expirationTtl: 3600 }); // 1 hour for files
                    // Also store with timestamp as backup/history
                    await storage.put(`file_${sessionId}_${cmdId}`, JSON.stringify(fileData), { expirationTtl: 3600 });
                } else {
                    await storage.put(`cmd_${sessionId}`, JSON.stringify({
                        ...command,
                        id: cmdId,
                        timestamp: cmdId
                    }), { expirationTtl: 300 });
                }
                return new Response(JSON.stringify({ success: true, id: cmdId, mock: !env.COMMANDS_KV }), { headers: corsHeaders });

            case 'pull': // From Desktop (listening for files/commands)
                // Check for files first - this is what FileManager uses
                // In production, this would iterate KV properly, but for now we'll store
                // the most recent file under a predictable key
                const mostRecentFile = await storage.get(`file_${sessionId}`);
                if (mostRecentFile) {
                    // Return the file and delete it (one-time retrieval)
                    await storage.delete(`file_${sessionId}`);
                    return new Response(mostRecentFile, { headers: corsHeaders });
                }
                
                // Fall back to commands for backward compatibility
                const cmd = await storage.get(`cmd_${sessionId}`);
                return new Response(cmd || JSON.stringify(null), { headers: corsHeaders });

            case 'sync': // From Desktop (reporting status)
                if (request.method !== 'POST') break;
                const state = await request.json();
                await storage.put(`state_${sessionId}`, JSON.stringify({
                    ...state,
                    lastSeen: Date.now()
                }), { expirationTtl: 600 });
                return new Response(JSON.stringify({ success: true, mock: !env.COMMANDS_KV }), { headers: corsHeaders });

            case 'status': // From Mobile (checking desktop state)
                const currentState = await storage.get(`state_${sessionId}`);
                if (currentState) {
                    const state = JSON.parse(currentState);
                    const isOnline = (Date.now() - state.lastSeen) < 10000; // 10 second timeout
                    return new Response(JSON.stringify({
                        online: isOnline,
                        state: state,
                        mock: !env.COMMANDS_KV
                    }), { headers: corsHeaders });
                } else {
                    return new Response(JSON.stringify({
                        online: false,
                        state: null,
                        mock: !env.COMMANDS_KV
                    }), { headers: corsHeaders });
                }

            case 'tools': // MCP-style tool discovery
                return new Response(JSON.stringify({
                    tools: [
                        { name: "open_app", description: "Open a window on desktop", parameters: { id: "string" } },
                        { name: "close_app", description: "Close a window on desktop", parameters: { id: "string" } },
                        { name: "alert", description: "Show notification", parameters: { message: "string" } },
                        { name: "reload", description: "Refresh desktop UI" }
                    ]
                }), { headers: corsHeaders });

            case 'files': // List received files
                const filesPattern = `file_${sessionId}_`;
                // Note: This is a simplified version. In production, you'd iterate KV keys properly
                // For now, return a mock structure that the desktop will poll
                return new Response(JSON.stringify({
                    files: []
                }), { headers: corsHeaders });
        }
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
}
