"use client";

import { socket } from './socket';

type StreamCallback = (stream: MediaStream) => void;

class WebRTCClient {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback: StreamCallback | null = null;
    private targetPeerId: string | null = null;
    private setupPromise: Promise<MediaStream> | null = null;
    private signalingTimeout: ReturnType<typeof setTimeout> | null = null;

    // 🟢 ICE Candidate Queue to prevent race conditions
    private iceCandidatesQueue: RTCIceCandidateInit[] = [];
    private isRemoteDescriptionSet = false;

    private config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // 💡 TIP: For production, add your TURN server here:
            // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'password' }
        ],
        // 🟢 High-Scale Optimization: Force iceTransportPolicy to 'all' (default) 
        // but ensure we handle gathering gracefully.
        iceCandidatePoolSize: 10,
    };

    async setupLocalStream(videoElement: HTMLVideoElement) {
        if (this.localStream && this.localStream.getTracks().some(t => t.readyState === 'live')) {
            if (videoElement && videoElement.srcObject !== this.localStream) {
                videoElement.srcObject = this.localStream;
            }
            return;
        }

        if (this.setupPromise) {
            try {
                const stream = await this.setupPromise;
                if (videoElement) {
                    videoElement.srcObject = stream;
                }
            } catch (e) { }
            return;
        }

        this.setupPromise = navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        try {
            this.localStream = await this.setupPromise;
            if (videoElement) {
                videoElement.srcObject = this.localStream;
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
        } finally {
            this.setupPromise = null;
        }
    }

    onRemoteStream(callback: StreamCallback) {
        this.onRemoteStreamCallback = callback;
        if (this.remoteStream) {
            callback(this.remoteStream);
        }
    }

    async initiateOffer(peerId: string) {
        console.log(`[WebRTC] Initiating offer to: ${peerId}`);
        this.targetPeerId = peerId;
        this.resetSignalingState();
        this.createPeerConnection(peerId);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        const offer = await this.peerConnection?.createOffer();
        await this.peerConnection?.setLocalDescription(offer);

        socket.emit('offer', { to: peerId, sdp: offer });
        this.startSignalingTimeout();
    }

    async handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
        console.log(`[WebRTC] Handling offer from: ${from}`);
        this.targetPeerId = from;
        this.resetSignalingState();
        this.createPeerConnection(from);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(sdp));
        this.isRemoteDescriptionSet = true;

        // 🟢 Flush queued candidates
        await this.processQueuedCandidates();

        const answer = await this.peerConnection?.createAnswer();
        await this.peerConnection?.setLocalDescription(answer);

        socket.emit('answer', { to: from, sdp: answer });
        this.startSignalingTimeout();
    }

    async handleAnswer(sdp: RTCSessionDescriptionInit) {
        if (this.peerConnection) {
            console.log("[WebRTC] Handling answer...");
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            this.isRemoteDescriptionSet = true;

            // 🟢 Flush queued candidates
            await this.processQueuedCandidates();
        }
    }

    async handleIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peerConnection) return;

        if (this.isRemoteDescriptionSet) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding ice candidate', e);
            }
        } else {
            // 🟢 Queue candidates if remote description isn't ready
            console.log("[WebRTC] Queuing ICE candidate (Handshake in progress)");
            this.iceCandidatesQueue.push(candidate);
        }
    }

    private async processQueuedCandidates() {
        console.log(`[WebRTC] Flushing ${this.iceCandidatesQueue.length} queued candidates.`);
        while (this.iceCandidatesQueue.length > 0) {
            const candidate = this.iceCandidatesQueue.shift();
            if (candidate && this.peerConnection) {
                try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding queued ice candidate', e);
                }
            }
        }
    }

    private resetSignalingState() {
        this.iceCandidatesQueue = [];
        this.isRemoteDescriptionSet = false;
    }

    private createPeerConnection(peerId: string) {
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        this.peerConnection = new RTCPeerConnection(this.config);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', { to: peerId, candidate: event.candidate });
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log("[WebRTC] Remote track received.");
            this.remoteStream = event.streams[0];
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(this.remoteStream);
            }
        };

        // Debug state changes
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            console.log(`[WebRTC] Connection state: ${state}`);
            if (state === 'connected') {
                this.clearSignalingTimeout();
            } else if (state === 'failed' || state === 'disconnected') {
                this.resetPeerConnection();
            }
        };
    }

    private startSignalingTimeout() {
        this.clearSignalingTimeout();
        this.signalingTimeout = setTimeout(() => {
            if (this.peerConnection?.connectionState !== 'connected') {
                console.warn("[WebRTC] Signaling timeout reached. Resetting...");
                this.resetPeerConnection();
            }
        }, 15000);
    }

    private clearSignalingTimeout() {
        if (this.signalingTimeout) {
            clearTimeout(this.signalingTimeout);
            this.signalingTimeout = null;
        }
    }

    toggleAudio(enabled: boolean) {
        this.localStream?.getAudioTracks().forEach(t => t.enabled = enabled);
    }

    toggleVideo(enabled: boolean) {
        this.localStream?.getVideoTracks().forEach(t => t.enabled = enabled);
    }

    async resetPeerConnection() {
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.targetPeerId = null;
        this.onRemoteStreamCallback = null;
        this.clearSignalingTimeout();
        this.resetSignalingState();
    }

    async cleanup() {
        if (this.setupPromise) {
            try {
                const stream = await this.setupPromise;
                stream.getTracks().forEach(t => t.stop());
            } catch (e) { }
            this.setupPromise = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        await this.resetPeerConnection();
    }
}

export const webrtc = new WebRTCClient();
