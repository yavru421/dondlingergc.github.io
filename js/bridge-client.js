/**
 * Bridge Client - Handles communication between desktop and mobile
 * Falls back to IndexedDB for local cross-tab communication when backend unavailable
 */


// WebRTC P2P File Transfer Client
class BridgeClient {
    constructor() {
        // WebRTC
        this.peerConnection = null;
        this.dataChannel = null;
        this.isInitiator = false;
        this.onSignal = null; // callback for signaling data (offer/answer/ICE)
        this.onFileReceived = null; // callback for received file
        // File transfer state
        this.incomingFile = null;
        this.incomingBuffer = [];
        this.incomingSize = 0;
        this.expectedSize = 0;
    }

    // Desktop: Start as initiator, create offer and data channel
    async startAsInitiator(onSignal) {
        this.isInitiator = true;
        this.onSignal = onSignal;
        this.peerConnection = new RTCPeerConnection();
        this.dataChannel = this.peerConnection.createDataChannel('file');
        this.setupDataChannel();
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onSignal) {
                this.onSignal({ type: 'ice', candidate: event.candidate });
            }
        };
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        if (this.onSignal) {
            this.onSignal({ type: 'offer', sdp: offer.sdp });
        }
    }

    // Mobile: Accept offer, create answer
    async acceptOffer(offerSdp, onSignal) {
        this.isInitiator = false;
        this.onSignal = onSignal;
        this.peerConnection = new RTCPeerConnection();
        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel();
        };
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onSignal) {
                this.onSignal({ type: 'ice', candidate: event.candidate });
            }
        };
        await this.peerConnection.setRemoteDescription({ type: 'offer', sdp: offerSdp });
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        if (this.onSignal) {
            this.onSignal({ type: 'answer', sdp: answer.sdp });
        }
    }

    // Both: Add answer from remote
    async acceptAnswer(answerSdp) {
        if (!this.peerConnection) return;
        await this.peerConnection.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    }

    // Both: Add ICE candidate
    async addIceCandidate(candidate) {
        if (!this.peerConnection) return;
        await this.peerConnection.addIceCandidate(candidate);
    }

    // Setup data channel events
    setupDataChannel() {
        if (!this.dataChannel) return;
        this.dataChannel.binaryType = 'arraybuffer';
        this.dataChannel.onopen = () => {
            console.log('[WebRTC] Data channel open');
            if (this.onStatusChange) this.onStatusChange('Connected');
        };
        this.dataChannel.onmessage = (event) => {
            this.handleDataChannelMessage(event.data);
        };
        this.dataChannel.onclose = () => {
            console.log('[WebRTC] Data channel closed');
            if (this.onStatusChange) this.onStatusChange('Disconnected');
        };
        // Also listen to ICE state
        if (this.peerConnection) {
             this.peerConnection.oniceconnectionstatechange = () => {
                 const state = this.peerConnection.iceConnectionState;
                 console.log('[WebRTC] ICE State:', state);
                 if (this.onStatusChange) this.onStatusChange('Connection: ' + state);
             };
        }
    }

    // Send file (as ArrayBuffer chunks)
    async sendFile(file) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') throw new Error('Channel not open');
        
        // Send metadata FIRST so receiver knows what to expect
        this.dataChannel.send(JSON.stringify({ 
            type: 'metadata', 
            name: file.name, 
            size: file.size, 
            mime: file.type 
        }));

        const chunkSize = 16384;
        let offset = 0;
        
        // Small delay to ensure metadata arrives first
        await new Promise(r => setTimeout(r, 50));

        while (offset < file.size) {
            const slice = file.slice(offset, offset + chunkSize);
            const buffer = await slice.arrayBuffer();
            this.dataChannel.send(buffer);
            offset += chunkSize;
        }
        
        // Send completion marker
        this.dataChannel.send(JSON.stringify({ done: true, name: file.name }));
    }

    // Handle incoming data
    handleDataChannelMessage(data) {
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                
                if (msg.type === 'metadata') {
                    // Start of new file
                    console.log('[Bridge] Receiving file:', msg.name);
                    this.incomingFileMeta = msg;
                    this.incomingBuffer = [];
                    this.receivedSize = 0;
                    if (this.onProgress) this.onProgress(0, msg.size);
                }
                else if (msg.done) {
                    // File transfer complete
                    console.log('[Bridge] File transfer complete:', msg.name);
                    const type = this.incomingFileMeta ? this.incomingFileMeta.mime : 'application/octet-stream';
                    const blob = new Blob(this.incomingBuffer, { type });
                    
                    this.incomingBuffer = [];
                    this.incomingFileMeta = null;
                    
                    if (this.onFileReceived) {
                        this.onFileReceived(blob, msg.name);
                    }
                    if (this.onProgress) this.onProgress(100, 100);
                }
            } catch (e) {
                console.error('JSON Parse error', e);
            }
        } else {
            // ArrayBuffer chunk
            this.incomingBuffer.push(data);
            if (this.incomingFileMeta && this.onProgress) {
                 this.receivedSize = (this.receivedSize || 0) + data.byteLength;
                 this.onProgress(this.receivedSize, this.incomingFileMeta.size);
            }
        }
    }

    // Backend test logic removed for P2P-only mode

    /**
     * Initialize IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open('DondlingerBridge', 1);

            request.onerror = () => {
                console.error('[BridgeClient] IndexedDB failed');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files');
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.dbReady = true;
                console.log('[BridgeClient] ✓ IndexedDB ready (localStorage enabled by default)');
                resolve();
            };
        });
    }

    /**
     * GET from bridge
     */
    async get(action, sessionId) {
        // Always use IndexedDB first
        const localData = await this.getFromIndexedDB(action, sessionId);
        if (localData) {
            console.log(`[BridgeClient] GET ${action}/${sessionId}: found in IndexedDB`);
            return localData;
        }

        // If not in local storage and network is available, try network
        if (!this.useLocalStorage) {
            try {
                const url = `${this.bridgeURL}?action=${action}&sessionId=${sessionId}`;
                const response = await fetch(url);
                if (!response.ok) return null;
                return await response.json();
            } catch (e) {
                console.warn('[BridgeClient] Network GET failed, reverting to local only');
                this.useLocalStorage = true;
            }
        }

        return null;
    }

    /**
     * POST to bridge
     */
    async post(action, sessionId, body, ttl = 300) {
        // Always store in IndexedDB first
        const localResult = await this.putInIndexedDB(action, sessionId, body, ttl);

        // Try network if available, but don't fail if it doesn't work
        if (!this.useLocalStorage) {
            try {
                const url = `${this.bridgeURL}?action=${action}&sessionId=${sessionId}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.warn('[BridgeClient] Network POST failed, using IndexedDB');
            }
        }

        return localResult;
    }

    /**
     * Get from IndexedDB
     */
    async getFromIndexedDB(action, sessionId) {
        return new Promise((resolve) => {
            if (!this.dbReady) {
                resolve(null);
                return;
            }

            const storeName = action === 'sync' ? 'state' : 'files';
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(sessionId);

            request.onsuccess = () => {
                const result = request.result;
                if (result && result.expiration && Date.now() > result.expiration) {
                    // Expired - delete it
                    const delTransaction = this.db.transaction([storeName], 'readwrite');
                    const delStore = delTransaction.objectStore(storeName);
                    delStore.delete(sessionId);
                    resolve(null);
                } else if (result) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => resolve(null);
        });
    }

    /**
     * Put in IndexedDB
     */
    async putInIndexedDB(action, sessionId, body, ttl) {
        return new Promise((resolve) => {
            if (!this.dbReady) {
                resolve(null);
                return;
            }

            const storeName = action === 'sync' ? 'state' : 'files';
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const expiration = Date.now() + (ttl * 1000);
            const request = store.put({ data: body, expiration: expiration }, sessionId);

            request.onsuccess = () => {
                resolve({ success: true, local: true });
            };

            request.onerror = () => resolve(null);
        });
    }

    /**
     * Check status (for mobile checking if desktop is online)
     */
    async checkStatus(sessionId) {
        const state = await this.get('state', sessionId);
        if (!state) {
            return { online: false };
        }

        const timeSinceLastSeen = Date.now() - state.lastSeen;
        const isOnline = timeSinceLastSeen < 10000;
        return {
            online: isOnline,
            state: state,
            timeSinceLastSeen: timeSinceLastSeen
        };
    }

    /**
     * Sync status (from desktop)
     */
    async syncStatus(sessionId, state) {
        const payload = {
            ...state,
            lastSeen: Date.now()
        };
        return await this.post('sync', sessionId, payload, 600);
    }

    /**
     * Push file (from mobile)
     */
    async pushFile(sessionId, fileData) {
        return await this.post('push', sessionId, { type: 'file_upload', file: fileData }, 3600);
    }

    /**
     * Pull file (from desktop)
     */
    async pullFile(sessionId) {
        return await this.get('pull', sessionId);
    }
}

// Create global instance
window.bridgeClient = null;


// Expose BridgeClient globally for P2P integration
window.BridgeClient = BridgeClient;
