/**
 * Bridge Client - Handles communication between desktop and mobile
 * Falls back to IndexedDB for local cross-tab communication when backend unavailable
 */

class BridgeClient {
    constructor(bridgeURL) {
        this.bridgeURL = bridgeURL;
        this.useLocalStorage = false;
        this.dbReady = false;
        this.testBackend();
        this.initIndexedDB();
    }

    /**
     * Test if backend is available
     */
    async testBackend() {
        try {
            const response = await fetch(this.bridgeURL + '?action=status&sessionId=test', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            console.log('[BridgeClient] Backend available (HTTP ' + response.status + ')');
            this.useLocalStorage = false;
        } catch (e) {
            console.log('[BridgeClient] Backend unavailable, using IndexedDB');
            this.useLocalStorage = true;
        }
    }

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
                console.log('[BridgeClient] IndexedDB ready');
                resolve();
            };
        });
    }

    /**
     * GET from bridge
     */
    async get(action, sessionId) {
        const url = `${this.bridgeURL}?action=${action}&sessionId=${sessionId}`;

        if (!this.useLocalStorage) {
            try {
                const response = await fetch(url);
                if (!response.ok) return null;
                return await response.json();
            } catch (e) {
                console.warn('[BridgeClient] Fetch failed:', e.message);
                this.useLocalStorage = true;
            }
        }

        // Fall back to IndexedDB
        return new Promise((resolve) => {
            if (!this.dbReady) {
                resolve(null);
                return;
            }

            const transaction = this.db.transaction([action], 'readonly');
            const store = transaction.objectStore(action);
            const request = store.get(sessionId);

            request.onsuccess = () => {
                const result = request.result;
                if (result && result.expiration && Date.now() > result.expiration) {
                    // Expired
                    resolve(null);
                } else {
                    resolve(result ? result.data : null);
                }
            };

            request.onerror = () => resolve(null);
        });
    }

    /**
     * POST to bridge
     */
    async post(action, sessionId, body, ttl = 300) {
        const url = `${this.bridgeURL}?action=${action}&sessionId=${sessionId}`;

        if (!this.useLocalStorage) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!response.ok) {
                    console.warn('[BridgeClient] POST failed:', response.status);
                    this.useLocalStorage = true;
                    return null;
                }
                return await response.json();
            } catch (e) {
                console.warn('[BridgeClient] POST fetch failed:', e.message);
                this.useLocalStorage = true;
            }
        }

        // Fall back to IndexedDB
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

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bridgeClient = new BridgeClient('/api/bridge');
    });
} else {
    window.bridgeClient = new BridgeClient('/api/bridge');
}
