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

    private config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    async setupLocalStream(videoElement: HTMLVideoElement) {
        // Reuse existing stream if it's still active
        if (this.localStream && this.localStream.getTracks().some(t => t.readyState === 'live')) {
            if (videoElement && videoElement.srcObject !== this.localStream) {
                videoElement.srcObject = this.localStream;
            }
            return;
        }

        // If a request is already in flight, wait for it
        if (this.setupPromise) {
            try {
                const stream = await this.setupPromise;
                if (videoElement) {
                    videoElement.srcObject = stream;
                }
            } catch (e) {
                // ignore, or retry?
            }
            return;
        }

        // Request a new stream
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
    }

    async initiateOffer(peerId: string) {
        this.targetPeerId = peerId;
        this.createPeerConnection(peerId);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        const offer = await this.peerConnection?.createOffer();
        await this.peerConnection?.setLocalDescription(offer);

        socket.emit('offer', { to: peerId, sdp: offer });
    }

    async handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
        this.targetPeerId = from;
        this.createPeerConnection(from);

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await this.peerConnection?.createAnswer();
        await this.peerConnection?.setLocalDescription(answer);

        socket.emit('answer', { to: from, sdp: answer });
    }

    async handleAnswer(sdp: RTCSessionDescriptionInit) {
        if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    }

    async handleIceCandidate(candidate: RTCIceCandidateInit) {
        if (this.peerConnection) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding ice candidate', e);
            }
        }
    }

    private createPeerConnection(peerId: string) {
        if (this.peerConnection) this.peerConnection.close();

        this.peerConnection = new RTCPeerConnection(this.config);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', { to: peerId, candidate: event.candidate });
            }
        };

        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(this.remoteStream);
            }
        };
    }

    toggleAudio(enabled: boolean) {
        this.localStream?.getAudioTracks().forEach(t => t.enabled = enabled);
    }

    toggleVideo(enabled: boolean) {
        this.localStream?.getVideoTracks().forEach(t => t.enabled = enabled);
    }

    async cleanup() {
        // If a setup is in progress, we must wait and stop it
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
    }
}

export const webrtc = new WebRTCClient();
