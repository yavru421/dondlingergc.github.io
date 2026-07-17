// zlaSync.js
class ZlaSync {
    constructor() {
        this.pc = null;
        this.dc = null;
        this.receivedMessages = [];
        this.receiveResolvers = [];
    }

    init() {
        this.pc = new RTCPeerConnection();
        this.dc = this.pc.createDataChannel("zlaSync");
        
        this.dc.onmessage = (event) => {
            if (this.receiveResolvers.length > 0) {
                const resolve = this.receiveResolvers.shift();
                resolve(event.data);
            } else {
                this.receivedMessages.push(event.data);
            }
        };

        this.pc.createOffer().then((offer) => {
            return this.pc.setLocalDescription(new RTCSessionDescription({ type: "offer", sdp: offer }));
        }).then(() => {
            // Send offer to remote peer
            fetch("/api/webrtc/offer", {
                method: "POST",
                body: JSON.stringify(this.pc.localDescription),
                headers: { "Content-Type": "application/json" }
            }).catch(err => console.error("Failed to send WebRTC offer:", err));
        });
    }

    send(message) {
        if (this.dc && this.dc.readyState === "open") {
            this.dc.send(message);
        } else {
            console.warn("WebRTC data channel is not open. Unable to send message:", message);
        }
    }

    receive() {
        if (this.receivedMessages.length > 0) {
            return Promise.resolve(this.receivedMessages.shift());
        }
        return new Promise((resolve) => {
            this.receiveResolvers.push(resolve);
        });
    }
}

window.zlaSync = new ZlaSync();
