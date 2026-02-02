const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for testing
let commands = {};
let states = {};
let signals = {}; // Store WebRTC signaling data

app.all('/api/bridge', (req, res) => {
    const { action, sessionId = 'default' } = req.query;

    console.log(`[${new Date().toISOString()}] ${req.method} /api/bridge?action=${action}&sessionId=${sessionId}`);

    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    });

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        switch (action) {
            case 'store-signal': // Store Offer/Answer/ICE
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                if (!signals[sessionId]) signals[sessionId] = [];
                const signalData = { ...req.body, timestamp: Date.now() };
                signals[sessionId].push(signalData);
                console.log('📡 Signal stored:', signalData.type);
                return res.json({ success: true });

            case 'get-signals': // Poll for new signals
                const lastTimestamp = parseInt(req.query.since || '0');
                const sessionSignals = signals[sessionId] || [];
                const newSignals = sessionSignals.filter(s => s.timestamp > lastTimestamp);
                return res.json({ signals: newSignals, timestamp: Date.now() });
            
            case 'push': // From Mobile/Agent to Desktop
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                const command = req.body;
                const cmdId = Date.now();
                commands[sessionId] = {
                    ...command,
                    id: cmdId,
                    timestamp: cmdId
                };
                console.log('📤 Command queued:', commands[sessionId]);
                return res.json({ success: true, id: cmdId });

            case 'pull': // From Desktop (listening)
                const cmd = commands[sessionId];
                if (cmd) {
                    delete commands[sessionId]; // Clear after reading
                    console.log('📥 Command delivered:', cmd);
                }
                return res.json(cmd || null);

            case 'sync': // From Desktop (reporting status)
                if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
                const state = req.body;
                states[sessionId] = {
                    ...state,
                    lastSeen: Date.now()
                };
                console.log('🔄 State synced:', states[sessionId]);
                return res.json({ success: true });

            case 'status': // From Mobile (checking desktop state)
                const currentState = states[sessionId];
                if (currentState) {
                    const isOnline = (Date.now() - currentState.lastSeen) < 10000; // 10 second timeout
                    console.log('📊 Status requested, online:', isOnline);
                    return res.json({
                        online: isOnline,
                        state: currentState
                    });
                } else {
                    console.log('📊 Status requested, no state found');
                    return res.json({
                        online: false,
                        state: null
                    });
                }

            case 'tools': // MCP-style tool discovery
                return res.json({
                    tools: [
                        { name: "open_app", description: "Open a window on desktop", parameters: { id: "string" } },
                        { name: "close_app", description: "Close a window on desktop", parameters: { id: "string" } },
                        { name: "alert", description: "Show notification", parameters: { message: "string" } },
                        { name: "reload", description: "Refresh desktop UI" }
                    ]
                });

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

const PORT = 8787;
app.listen(PORT, () => {
    console.log(`🚀 Bridge API Server running on http://localhost:${PORT}`);
    console.log(`📱 Test endpoints:`);
    console.log(`   GET  /api/bridge?action=status&sessionId=default`);
    console.log(`   POST /api/bridge?action=push&sessionId=default`);
    console.log(`   GET  /api/bridge?action=pull&sessionId=default`);
    console.log(`   POST /api/bridge?action=sync&sessionId=default`);
    console.log(`   GET  /api/bridge?action=tools`);
});