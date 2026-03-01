"use client";

import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { socket } from '@/lib/socket';
import { VideoPanel } from '@/components/chat/VideoPanel';
import { ChatBox } from '@/components/chat/ChatBox';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Flag, Eye, Sparkles, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ChatPage() {
    const { session, isSearching, incomingCall, setSearching, disconnect, setMatched, addMessage } = useChatStore();
    const { data: sessionData, status } = useSession();
    const { toast } = useToast();
    const router = useRouter();

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isBlurred, setIsBlurred] = useState(true);

    const handleMatch = useCallback((data: { peerId: string, peerName?: string, peerAvatar?: string }) => {
        // For anonymous rooms, we don't store or show the peer's actual identity
        setMatched("anonymous-room", data.peerId, "Stranger", "");
        setIsBlurred(true);
        toast({ title: 'Matched!', description: 'Say hello to your new vibe buddy.' });
    }, [setMatched, toast]);

    const handlePeerDisconnect = useCallback(() => {
        toast({ title: 'Stranger disconnected', description: 'They left the vibe.' });
        disconnect();
        webrtc.cleanup();
    }, [disconnect, toast]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        socket.connect();

        socket.on('matched', handleMatch);
        socket.on('peerDisconnected', handlePeerDisconnect);

        socket.on('call-rejected', () => {
            toast({ title: 'Call rejected', variant: 'destructive' });
            disconnect();
            router.push('/dms');
        });

        socket.on('answer-made', async ({ answer }) => {
            await webrtc.handleAnswer(answer);
        });

        socket.on('offer', async ({ from, sdp }) => {
            await webrtc.handleOffer(from, sdp);
        });

        socket.on('answer', async ({ sdp }) => {
            await webrtc.handleAnswer(sdp);
        });

        socket.on('iceCandidate', async ({ candidate }) => {
            await webrtc.handleIceCandidate(candidate);
        });

        socket.on('message', ({ from, content }) => {
            addMessage({
                id: Date.now().toString(),
                senderId: from,
                text: content,
                timestamp: Date.now()
            });
        });

        // If we are already matched (direct call initiated or accepted)
        if (session.isMatched && session.roomId === "direct-room") {
            const initiateFriendCall = async () => {
                if (incomingCall) {
                    // We are the receiver, handle the offer already stored
                    await webrtc.handleOffer(incomingCall.from, incomingCall.offer);
                } else {
                    // We are the caller, send invitation
                    socket.emit('call-user', {
                        to: session.strangerId,
                        fromName: sessionData?.user?.name || "Someone",
                        fromAvatar: sessionData?.user?.image || "",
                        signalData: null
                    });
                }
            };
            initiateFriendCall();
        }

        return () => {
            socket.off('matched');
            socket.off('peerDisconnected');
            socket.off('call-rejected');
            socket.off('answer-made');
            socket.off('offer');
            socket.off('answer');
            socket.off('iceCandidate');
            socket.off('message');
            socket.disconnect();
            disconnect();
            webrtc.cleanup();
        };
    }, [handleMatch, handlePeerDisconnect, addMessage, disconnect, session.isMatched, session.roomId, session.strangerId, incomingCall, sessionData, router, toast, status]);

    useEffect(() => {
        webrtc.toggleAudio(audioEnabled);
    }, [audioEnabled]);

    useEffect(() => {
        webrtc.toggleVideo(videoEnabled);
    }, [videoEnabled]);

    const handleStart = () => {
        setSearching(true);
        socket.emit('joinQueue');
        toast({ title: 'Searching...', description: 'Finding a vibe for you.' });
    };

    const handleSkip = () => {
        if (session.strangerId) {
            socket.emit('skip', { peerId: session.strangerId });
        }
        disconnect();
        webrtc.cleanup();
        handleStart();
    };

    const handleClose = () => {
        socket.emit('leaveQueue');
        disconnect();
        webrtc.cleanup();
        router.push('/dms');
    };

    const handleReport = () => {
        toast({ title: 'User Reported', description: 'Thank you for keeping VibeChat safe.', variant: 'destructive' });
        handleSkip();
    };

    const initiateCall = async () => {
        if (session.strangerId) {
            await webrtc.initiateOffer(session.strangerId);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#050505] text-white selection:bg-primary/30 overflow-hidden">
            {/* Dynamic Header */}
            <div className="absolute top-0 inset-x-0 h-20 z-40 px-6 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full bg-white/5 hover:bg-white/10 border border-white/5 h-12 w-12 transition-all">
                        <X className="w-5 h-5 text-white/70" />
                    </Button>
                </div>

                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-4 pointer-events-auto">
                    <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                        <div className={cn("w-2 h-2 rounded-full transition-all duration-500", isSearching ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" : session.isMatched ? "bg-green-500" : "bg-red-500")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                            {isSearching ? "Searching" : session.isMatched ? "Live" : "Standby"}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setAudioEnabled(!audioEnabled)} className={cn("h-8 w-8 rounded-lg hover:bg-white/10", !audioEnabled && "text-red-500 bg-red-500/10")}>
                            {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setVideoEnabled(!videoEnabled)} className={cn("h-8 w-8 rounded-lg hover:bg-white/10", !videoEnabled && "text-red-500 bg-red-500/10")}>
                            {videoEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                <div className="pointer-events-auto">
                    <Button onClick={isSearching ? () => { socket.emit('leaveQueue'); disconnect(); } : handleSkip} disabled={!session.isMatched && !isSearching} className="rounded-full px-8 h-12 font-black uppercase tracking-widest text-xs bg-white text-black hover:scale-105 active:scale-95 shadow-2xl transition-all">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next Match"}
                    </Button>
                </div>
            </div>

            <main className="flex-1 relative flex overflow-hidden">
                {/* Main Video View */}
                <div className="flex-1 relative bg-[#0a0a0a]">
                    <VideoPanel
                        isMatched={session.isMatched}
                        className={cn(
                            "w-full h-full border-none rounded-none aspect-auto shadow-none bg-transparent transition-all duration-1000",
                            isBlurred && session.isMatched && "blur-[100px] scale-110 opacity-50"
                        )}
                    />

                    {/* Controls & State Overlays */}
                    {!session.isMatched && !isSearching && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-8 border border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.2)]">
                                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Vibe Check?</h2>
                            <p className="text-white/40 mb-8 max-w-xs text-center font-medium">Connect with a random stranger instantly. Safe, simple, and pure vibes.</p>
                            <Button size="lg" onClick={handleStart} className="rounded-full px-12 h-16 font-black text-lg shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all bg-primary">
                                START VIBING
                            </Button>
                        </div>
                    )}

                    {session.isMatched && isBlurred && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                            <div className="glass-card p-12 rounded-[50px] text-center max-w-md border-white/5 shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col items-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                    <Sparkles className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                                    {session.peerName || "Stranger"} Connected
                                </h3>
                                <p className="text-white/50 font-medium mb-8">
                                    {session.roomId === "direct-room" ? "The vibe is waiting for you." : "Ready to reveal the vibe?"}
                                </p>
                                <Button onClick={() => { setIsBlurred(false); initiateCall(); }} size="lg" className="rounded-full shadow-2xl px-12 h-16 gap-3 font-black text-lg bg-primary hover:scale-105 active:scale-95 transition-all">
                                    <Eye className="w-6 h-6" /> REVEAL CHAT
                                </Button>
                            </div>
                        </div>
                    )}

                    {session.isMatched && !isBlurred && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReport}
                            className="absolute bottom-10 right-10 z-30 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-500 rounded-full h-12 w-12 transition-all border border-white/5 backdrop-blur-md"
                            title="Report User"
                        >
                            <Flag className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Local Preview - PiP style */}
                <div className="absolute bottom-10 left-10 w-72 h-52 z-30 group">
                    <VideoPanel
                        isLocal
                        className={cn(
                            "w-full h-full border-white/10 shadow-2xl rounded-[40px] overflow-hidden bg-black ring-1 ring-white/10 transition-all group-hover:scale-105",
                            !videoEnabled && "opacity-40"
                        )}
                    />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        Preview
                    </div>
                </div>

                {/* Floating Chat Box */}
                <div className="absolute bottom-10 right-10 w-[400px] h-[500px] z-20 pointer-events-none">
                    <div className="h-full pointer-events-auto">
                        <ChatBox />
                    </div>
                </div>
            </main>
        </div>
    );
}
