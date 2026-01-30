export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('sessionId') || 'default';

    // Validate session ID format
    if (!isValidSessionId(sessionId)) {
        return new Response(JSON.stringify({ error: 'Invalid session ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Use KV if available, else use persistent fallback storage
    // Fallback storage persists for the lifetime of this Worker instance
    const storage = env.COMMANDS_KV || createFallbackStorage();
    const isUsingKV = !!env.COMMANDS_KV;

    console.log(`[Bridge] Storage: ${isUsingKV ? 'KV' : 'Fallback'} | Session: ${sessionId} | Action: ${action}`);

    try {
        switch (action) {
            case 'push': // From Mobile/Agent to Desktop
                if (request.method !== 'POST') break;

                const contentLength = request.headers.get('content-length');
                const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

                if (contentLength && parseInt(contentLength) > MAX_UPLOAD_SIZE) {
                    return new Response(JSON.stringify({
                        error: 'File too large. Maximum size is 50MB'
                    }), {
                        status: 413,
                        headers: corsHeaders
                    });
                }

                let command;
                try {
                    command = await request.json();
                } catch (e) {
                    return new Response(JSON.stringify({
                        error: 'Invalid JSON in request body'
                    }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                // Validate file upload
                if (command.type === 'file_upload' && command.file) {
                    const validation = validateFileUpload(command.file);
                    if (!validation.valid) {
                        return new Response(JSON.stringify({
                            error: validation.error
                        }), {
                            status: 400,
                            headers: corsHeaders
                        });
                    }

                    const cmdId = Date.now();
                    const fileData = {
                        ...command,
                        id: cmdId,
                        timestamp: cmdId,
                        uploadedAt: new Date().toISOString()
                    };

                    await storage.put(`file_${sessionId}`, JSON.stringify(fileData), { expirationTtl: 3600 });
                    await storage.put(`file_${sessionId}_${cmdId}`, JSON.stringify(fileData), { expirationTtl: 3600 });

                    return new Response(JSON.stringify({
                        success: true,
                        id: cmdId,
                        message: 'File uploaded successfully',
                        mock: !env.COMMANDS_KV
                    }), { headers: corsHeaders });
                } else {
                    await storage.put(`cmd_${sessionId}`, JSON.stringify({
                        ...command,
                        id: Date.now(),
                        timestamp: Date.now()
                    }), { expirationTtl: 300 });

                    return new Response(JSON.stringify({ success: true, mock: !env.COMMANDS_KV }), { headers: corsHeaders });
                }

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
                console.log(`[Bridge] Sync from desktop session ${sessionId}:`, state);
                const newState = {
                    ...state,
                    lastSeen: Date.now()
                };
                await storage.put(`state_${sessionId}`, JSON.stringify(newState), { expirationTtl: 600 });
                console.log(`[Bridge] ✓ Stored state for ${sessionId}, TTL: 600s`);
                return new Response(JSON.stringify({ success: true, mock: !env.COMMANDS_KV }), { headers: corsHeaders });

            case 'status': // From Mobile (checking desktop state)
                const currentState = await storage.get(`state_${sessionId}`);
                console.log(`[Bridge] Status check for ${sessionId}: currentState=`, currentState ? 'exists' : 'null');
                if (currentState) {
                    const state = JSON.parse(currentState);
                    const timeSinceLastSeen = Date.now() - state.lastSeen;
                    const isOnline = timeSinceLastSeen < 10000; // 10 second timeout
                    console.log(`[Bridge] Status check: timeSinceLastSeen=${timeSinceLastSeen}ms, isOnline=${isOnline}`);
                    return new Response(JSON.stringify({
                        online: isOnline,
                        state: state,
                        timeSinceLastSeen: timeSinceLastSeen,
                        mock: !env.COMMANDS_KV
                    }), { headers: corsHeaders });
                } else {
                    console.log(`[Bridge] Status check: No state found for ${sessionId}`);
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
        console.error('[Bridge] Error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
}

/**
 * Validate session ID format
 */
function isValidSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return false;
    if (sessionId.length > 100) return false;
    // Allow alphanumeric, dashes, underscores
    return /^[a-zA-Z0-9_-]+$/.test(sessionId);
}

/**
 * Validate file upload data
 */
function validateFileUpload(file) {
    if (!file) return { valid: false, error: 'No file provided' };

    // Validate file name
    if (!file.name || typeof file.name !== 'string') {
        return { valid: false, error: 'Invalid file name' };
    }
    if (file.name.length > 255) {
        return { valid: false, error: 'File name too long' };
    }
    // Prevent path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { valid: false, error: 'Invalid file name characters' };
    }

    // Validate file size
    if (typeof file.size !== 'number' || file.size <= 0) {
        return { valid: false, error: 'Invalid file size' };
    }
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File exceeds 50MB limit' };
    }

    // Validate base64 data
    if (!file.data || typeof file.data !== 'string') {
        return { valid: false, error: 'No file data provided' };
    }
    if (file.data.length > 100 * 1024 * 1024) { // 100MB in base64 is ~75MB raw
        return { valid: false, error: 'File data too large' };
    }

    // Validate MIME type if provided
    if (file.mimeType && typeof file.mimeType === 'string') {
        if (file.mimeType.length > 100) {
            return { valid: false, error: 'Invalid MIME type' };
        }
    }

    return { valid: true };
}

/**
 * Create fallback storage when KV is not available
 * This is used when deploying without KV binding
 */
let fallbackStorage = {};
let fallbackExpirations = {};

function createFallbackStorage() {
    return {
        async get(key) {
            // Check if key has expired
            if (fallbackExpirations[key] && Date.now() > fallbackExpirations[key]) {
                delete fallbackStorage[key];
                delete fallbackExpirations[key];
                return null;
            }
            return fallbackStorage[key] || null;
        },
        async put(key, value, options) {
            fallbackStorage[key] = value;
            // Set expiration if TTL provided
            if (options && options.expirationTtl) {
                fallbackExpirations[key] = Date.now() + (options.expirationTtl * 1000);
            }
        },
        async delete(key) {
            delete fallbackStorage[key];
            delete fallbackExpirations[key];
        }
    };
}
