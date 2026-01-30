/**
 * Bridge Client - Handles communication between desktop and mobile
 * Falls back to IndexedDB for local cross-tab communication when backend unavailable
 */

class BridgeClient {
    constructor(bridgeURL) {
        this.bridgeURL = bridgeURL;
        // Start with local storage (IndexedDB) - we'll only try network if it fails
        this.useLocalStorage = true;
        this.dbReady = false;
        this.initIndexedDB();
        // Test backend availability in background
        this.testBackend();
    }

    /**
     * Test if backend is available (non-blocking)
     */
    async testBackend() {
        try {
            const response = await Promise.race([
                fetch(this.bridgeURL + '?action=status&sessionId=test', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
            
            if (response.ok) {
                const data = await response.json();
                // Only use network if we get a real response (not mock)
                if (!data.mock) {
                    console.log('[BridgeClient] Real backend available');
                    this.useLocalStorage = false;
                } else {
                    console.log('[BridgeClient] Backend available but mock, using IndexedDB');
                }
            }
        } catch (e) {
            console.log('[BridgeClient] Backend unavailable, using IndexedDB only');
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

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bridgeClient = new BridgeClient('/api/bridge');
    });
} else {
    window.bridgeClient = new BridgeClient('/api/bridge');
}
