/**
 * Mock Bridge Server for Local Testing
 * Simulates the Cloudflare Workers /api/bridge endpoint
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// In-memory storage (simulating KV)
const storage = {};

const server = http.createServer((req, res) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const action = parsedUrl.query.action;
    const sessionId = parsedUrl.query.sessionId || 'default';

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    try {
        switch (action) {
            case 'push': // Mobile uploading file
                if (req.method !== 'POST') {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'POST required' }));
                    break;
                }

                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const command = JSON.parse(body);
                        const cmdId = Date.now();

                        // Store file in memory - under main key for pull to retrieve
                        const fileData = {
                            ...command,
                            id: cmdId,
                            timestamp: cmdId
                        };
                        storage[`file_${sessionId}`] = JSON.stringify(fileData);
                        storage[`file_${sessionId}_${cmdId}`] = JSON.stringify(fileData);

                        console.log(`✓ File received: ${command.file?.name || 'unknown'}`);

                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            id: cmdId,
                            message: 'File uploaded successfully'
                        }));
                    } catch (e) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
                break;

            case 'pull': // Desktop checking for files
                // Check for file under main key first
                const fileData = storage[`file_${sessionId}`];
                if (fileData) {
                    delete storage[`file_${sessionId}`]; // One-time retrieval
                    res.writeHead(200, corsHeaders);
                    res.end(fileData);
                } else {
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify(null));
                }
                break;

            case 'sync': // Desktop reporting status
                if (req.method !== 'POST') {
                    res.writeHead(400, corsHeaders);
                    res.end(JSON.stringify({ error: 'POST required' }));
                    break;
                }

                let syncBody = '';
                req.on('data', chunk => syncBody += chunk);
                req.on('end', () => {
                    try {
                        const state = JSON.parse(syncBody);
                        storage[`state_${sessionId}`] = JSON.stringify({
                            ...state,
                            lastSeen: Date.now()
                        });

                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({ success: true }));
                    } catch (e) {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
                break;

            case 'status': // Mobile checking desktop status
                const stateKey = `state_${sessionId}`;
                if (storage[stateKey]) {
                    const state = JSON.parse(storage[stateKey]);
                    const isOnline = (Date.now() - state.lastSeen) < 10000;

                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({
                        online: isOnline,
                        state: state
                    }));
                } else {
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({
                        online: false,
                        state: null
                    }));
                }
                break;

            default:
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Invalid action' }));
        }
    } catch (err) {
        console.error('Error:', err);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: err.message }));
    }
});

const PORT = 8787;
server.listen(PORT, () => {
    console.log(`\n🌉 Mock Bridge Server running at http://localhost:${PORT}/api/bridge`);
    console.log(`\n📝 The main app should be served on http://localhost:8000\n`);
});
