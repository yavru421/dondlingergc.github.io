class ZlaSync {
    constructor() {
        this.pc = new RTCPeerConnection();
        this.dc = this.pc.createDataChannel("zlaSync");
        this.bufferQueue = [];
        this.isConnected = false;
    }

    init() {
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to remote peer
                fetch("/api/webrtc/icecandidate", {
                    method: "POST",
                    body: JSON.stringify(event.candidate),
                    headers: { "Content-Type": "application/json" }
                });
            }
        };

        this.dc.onopen = () => {
            this.isConnected = true;
            this.flushBufferQueue();
        };

        this.dc.onclose = () => {
            this.isConnected = false;
        };

        this.dc.onerror = (event) => {
            console.error("Data channel error:", event);
        };

        this.pc.createOffer().then((offer) => {
            return this.pc.setLocalDescription(new RTCSessionDescription({ type: "offer", sdp: offer }));
        }).then(() => {
            // Send offer to remote peer
            fetch("/api/webrtc/offer", {
                method: "POST",
                body: JSON.stringify(this.pc.localDescription),
                headers: { "Content-Type": "application/json" }
            });
        });
    }

    send(data) {
        if (this.isConnected) {
            this.dc.send(data);
        } else {
            this.bufferQueue.push(data);
        }
    }

    flushBufferQueue() {
        while (this.bufferQueue.length > 0) {
            var data = this.bufferQueue.shift();
            this.dc.send(data);
        }
    }
}

window.zlaSync = new ZlaSync();
