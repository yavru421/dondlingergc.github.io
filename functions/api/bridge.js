export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    let sessionId = url.searchParams.get('sessionId');

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

    // ======== GENERATE NEW SESSION (Multi-user) ========
    if (action === 'generate') {
        try {
            const newSessionId = generateSessionId();
            const qrUrl = `${url.origin}/mobilestatic/files.html?sessionId=${newSessionId}`;

            // Initialize session metadata
            const sessionMetadata = {
                sessionId: newSessionId,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                fileCount: 0,
                totalSize: 0,
                lastActivity: new Date().toISOString()
            };

            await storage.put(
                `session_${newSessionId}`,
                JSON.stringify(sessionMetadata),
                { expirationTtl: 24 * 60 * 60 } // 24 hour TTL
            );

            return new Response(JSON.stringify({
                success: true,
                sessionId: newSessionId,
                qrUrl: qrUrl,
                websiteUrl: `${url.origin}/mobilestatic/files.html?sessionId=${newSessionId}`,
                expiresAt: sessionMetadata.expiresAt,
                instructions: 'Scan the QR code with your phone or visit the link'
            }), {
                status: 200,
                headers: corsHeaders
            });
        } catch (error) {
            console.error('[Bridge] Generate session error:', error);
            return new Response(JSON.stringify({
                error: 'Failed to generate session: ' + error.message
            }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }

    // ======== VALIDATE SESSION (all other actions) ========
    if (!sessionId) {
        return new Response(JSON.stringify({
            error: 'Session ID required. Call ?action=generate first'
        }), {
            status: 400,
            headers: corsHeaders
        });
    }

    // Check if session exists and is valid
    const sessionData = await storage.get(`session_${sessionId}`);
    if (!sessionData) {
        return new Response(JSON.stringify({
            error: 'Session not found or expired. Generate a new session.'
        }), {
            status: 404,
            headers: corsHeaders
        });
    }

    // Update last activity
    try {
        const metadata = JSON.parse(sessionData);
        metadata.lastActivity = new Date().toISOString();
        await storage.put(
            `session_${sessionId}`,
            JSON.stringify(metadata),
            { expirationTtl: 24 * 60 * 60 }
        );
    } catch (e) {
        // Continue even if metadata update fails
    }

    try {
        switch (action) {
            case 'store-signal': // WebRTC Signaling
                if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
                const newSignal = await request.json();
                newSignal.timestamp = Date.now();
                
                // Read existing signals
                let signalList = [];
                try {
                    const existing = await storage.get(`signals_${sessionId}`);
                    if (existing) signalList = JSON.parse(existing);
                } catch(e) {}
                
                signalList.push(newSignal);
                
                // Write back (TTL 5 minutes is generous for handshake)
                await storage.put(`signals_${sessionId}`, JSON.stringify(signalList), { expirationTtl: 300 });
                
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

            case 'get-signals':
                const since = parseInt(url.searchParams.get('since') || '0');
                let allSignals = [];
                try {
                    const data = await storage.get(`signals_${sessionId}`);
                    if (data) allSignals = JSON.parse(data);
                } catch(e) {}
                
                const foundSignals = allSignals.filter(s => s.timestamp > since);
                return new Response(JSON.stringify({ signals: foundSignals, timestamp: Date.now() }), { headers: corsHeaders });

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

                    const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                    const fileData = {
                        ...command,
                        id: fileId,
                        timestamp: Date.now(),
                        uploadedAt: new Date().toISOString(),
                        sessionId: sessionId // Track which session owns this file
                    };

                    // Store with session-specific key for isolation
                    await storage.put(`file_${sessionId}_${fileId}`, JSON.stringify(fileData), { expirationTtl: 24 * 60 * 60 });

                    // Update session file count
                    try {
                        const metadata = JSON.parse(await storage.get(`session_${sessionId}`));
                        metadata.fileCount = (metadata.fileCount || 0) + 1;
                        metadata.totalSize = (metadata.totalSize || 0) + (command.file.size || 0);
                        await storage.put(`session_${sessionId}`, JSON.stringify(metadata), { expirationTtl: 24 * 60 * 60 });
                    } catch (e) {
                        console.warn('[Bridge] Failed to update session metadata:', e);
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        fileId: fileId,
                        message: 'File uploaded successfully'
                    }), { headers: corsHeaders });
                } else {
                    await storage.put(`cmd_${sessionId}`, JSON.stringify({
                        ...command,
                        id: Date.now(),
                        timestamp: Date.now(),
                        sessionId: sessionId
                    }), { expirationTtl: 300 });

                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                }

            case 'pull': // From Desktop (listening for files/commands)
                // Check for files first - this is what FileManager uses
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
                    lastSeen: Date.now(),
                    sessionId: sessionId
                };
                await storage.put(`state_${sessionId}`, JSON.stringify(newState), { expirationTtl: 600 });
                console.log(`[Bridge] ✓ Stored state for ${sessionId}, TTL: 600s`);
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });

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
                        timeSinceLastSeen: timeSinceLastSeen
                    }), { headers: corsHeaders });
                } else {
                    console.log(`[Bridge] Status check: No state found for ${sessionId}`);
                    return new Response(JSON.stringify({
                        online: false,
                        state: null
                    }), { headers: corsHeaders });
                }

            case 'session_info': // Get session metadata
                const meta = await storage.get(`session_${sessionId}`);
                if (meta) {
                    return new Response(meta, { headers: corsHeaders });
                }
                return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: corsHeaders });

            case 'list_files': // List all files in session
                // Note: This is simplified - in production with many files, would need pagination
                const filePrefix = `file_${sessionId}_`;
                return new Response(JSON.stringify({
                    sessionId: sessionId,
                    files: [],
                    note: 'File listing limited - use individual file IDs'
                }), { headers: corsHeaders });

            case 'tools': // MCP-style tool discovery
                return new Response(JSON.stringify({
                    tools: [
                        { name: "open_app", description: "Open a window on desktop", parameters: { id: "string" } },
                        { name: "close_app", description: "Close a window on desktop", parameters: { id: "string" } },
                        { name: "alert", description: "Show notification", parameters: { message: "string" } },
                        { name: "reload", description: "Refresh desktop UI" }
                    ]
                }), { headers: corsHeaders });
        }
    } catch (err) {
        console.error('[Bridge] Error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
}

/**
 * Generate unique session ID for each visitor
 */
function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 12);
    return `${timestamp}-${random}`;
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
    if (file.size > MAX_FILE_SIZE ) {
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
