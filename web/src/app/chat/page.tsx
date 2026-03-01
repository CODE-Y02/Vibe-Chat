"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/hooks/use-socket';
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
    const { socket, isConnected } = useSocket();
    const { toast } = useToast();
    const router = useRouter();

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isBlurred, setIsBlurred] = useState(true);

    // Refs for intervals to prevent leaks
    const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
    const retryInterval = useRef<NodeJS.Timeout | null>(null);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. STABLE CALLBACKS
    // ──────────────────────────────────────────────────────────────────────────
    const handleMatch = useCallback((data: { peerId: string, peerName?: string, peerAvatar?: string }) => {
        setMatched("anonymous-room", data.peerId, "Stranger", "");
        setIsBlurred(true);
        toast({ title: 'Matched!', description: 'Say hello to your new vibe buddy.' });
    }, [setMatched, toast]);

    const handlePeerDisconnect = useCallback(() => {
        toast({ title: 'Stranger disconnected', description: 'They left the vibe.' });
        disconnect();
        webrtc.cleanup();
        setIsBlurred(true);
    }, [disconnect, toast]);

    const onMessage = useCallback(({ from, content }: { from: string, content: string }) => {
        addMessage({
            id: Date.now().toString(),
            senderId: from,
            text: content,
            timestamp: Date.now()
        });
    }, [addMessage]);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. AUTH / REDIRECT LOGIC
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CONNECTION LIFECYCLE (Stable)
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'authenticated' || !sessionData?.accessToken || !socket) return;

        console.log("[ChatPage] Lifecycle: Initializing match state...");
        socket.auth = { token: sessionData.accessToken };

        // Reconnect if needed
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            console.log("[ChatPage] Lifecycle Cleanup: Clearing chat state...");
            disconnect(); // Clear local chat store
            webrtc.cleanup(); // Clean up media
        };
    }, [status, socket, disconnect, sessionData?.accessToken]);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. EVENT LISTENERS (Separate to avoid connection churn)
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'authenticated') return;

        socket.on('matched', handleMatch);
        socket.on('peerDisconnected', handlePeerDisconnect);
        socket.on('message', onMessage);

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

        return () => {
            socket.off('matched');
            socket.off('peerDisconnected');
            socket.off('message');
            socket.off('call-rejected');
            socket.off('answer-made');
            socket.off('offer');
            socket.off('answer');
            socket.off('iceCandidate');
        };
    }, [status, handleMatch, handlePeerDisconnect, onMessage, router, toast, disconnect]);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. INTERVALS (Heartbeat & Search Retry)
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'authenticated') return;

        heartbeatInterval.current = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat');
            }
        }, 15000);

        return () => {
            if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        };
    }, [status]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        // Only search retry if we are actually searching and NOT matched
        if (isSearching && !session.isMatched) {
            retryInterval.current = setInterval(() => {
                if (socket.connected) {
                    console.log("[Search] Retrying atomic match...");
                    socket.emit('joinQueue');
                }
            }, 5000);
        } else {
            if (retryInterval.current) clearInterval(retryInterval.current);
        }

        return () => {
            if (retryInterval.current) clearInterval(retryInterval.current);
        };
    }, [status, isSearching, session.isMatched]);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. UI ACTIONS
    // ──────────────────────────────────────────────────────────────────────────
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
        console.log("[UI] Skipping match...");
        if (session.strangerId) {
            socket.emit('skip', { peerId: session.strangerId });
        }
        disconnect();
        webrtc.cleanup();
        setIsBlurred(true);
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
            setIsBlurred(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-[#050505] text-white selection:bg-primary/30 overflow-hidden relative">
            {/* 1. ULTRA-RESPONSIVE HEADER */}
            <header className="absolute top-0 inset-x-0 h-14 md:h-24 z-50 px-2 sm:px-4 md:px-8 flex items-center gap-2 pointer-events-none">
                {/* Left: Close */}
                <div className="pointer-events-auto flex justify-start">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 h-9 w-9 md:h-14 md:w-14 hover:bg-white/10 transition-all shrink-0 shadow-2xl"
                    >
                        <X className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </Button>
                </div>

                {/* Center: Status Pill */}
                <div className="pointer-events-auto flex-1 flex justify-center overflow-hidden">
                    <div className="bg-black/60 backdrop-blur-3xl border border-white/10 px-2.5 md:px-6 py-1.5 md:py-3 rounded-full flex items-center gap-1.5 md:gap-4 shrink-1 shadow-2xl transition-all min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 pr-1.5 md:pr-4 border-r border-white/10">
                            <div className={cn(
                                "w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full transition-all duration-500 flex-shrink-0",
                                isSearching ? "bg-primary animate-pulse" : session.isMatched ? "bg-green-500" : "bg-red-500"
                            )} />
                            <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">
                                {isSearching ? (
                                    <span className="hidden sm:inline">Searching</span>
                                ) : session.isMatched ? (
                                    <span className="hidden sm:inline">Live</span>
                                ) : (
                                    <span className="hidden sm:inline">Standby</span>
                                )}
                                <span className="sm:hidden">{isSearching ? "..." : session.isMatched ? "On" : "Off"}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-5 flex-shrink-0 text-white/60">
                            <button onClick={() => setAudioEnabled(!audioEnabled)} className={cn("transition-colors", !audioEnabled && "text-red-500")}>
                                {audioEnabled ? <Mic className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <MicOff className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                            </button>
                            <button onClick={() => setVideoEnabled(!videoEnabled)} className={cn("transition-colors", !videoEnabled && "text-red-500")}>
                                {videoEnabled ? <VideoIcon className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <VideoOff className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Next Match */}
                <div className="pointer-events-auto flex justify-end">
                    <Button
                        onClick={isSearching ? () => { socket.emit('leaveQueue'); disconnect(); } : handleSkip}
                        className="rounded-full px-3 md:px-10 h-9 md:h-14 font-black uppercase tracking-widest text-[8px] md:text-xs bg-white text-black hover:scale-105 active:scale-95 shadow-xl transition-all shrink-0"
                    >
                        {isSearching ? <Loader2 className="w-3 h-3 md:w-5 md:h-5 animate-spin" /> : (
                            <>
                                <span className="hidden sm:inline">Next Match</span>
                                <span className="sm:hidden">Next</span>
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                {/* 2. MAIN CONTENT ZONE */}
                <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                    <VideoPanel
                        isMatched={session.isMatched}
                        className={cn(
                            "w-full h-full border-none rounded-none aspect-auto shadow-none bg-transparent transition-all duration-1000",
                            isBlurred && session.isMatched && "blur-[60px] md:blur-[120px] scale-110 opacity-60"
                        )}
                    />

                    {/* OVERLAYS (Centered Cards) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-4">
                        <div className="pointer-events-auto w-full max-w-[90%] sm:max-w-md">
                            {!session.isMatched && !isSearching && (
                                <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
                                    <div className="w-16 h-16 md:w-28 md:h-28 bg-primary/20 rounded-full flex items-center justify-center mb-6 md:mb-10 border border-primary/30 shadow-[0_0_80px_rgba(var(--primary),0.3)] group cursor-pointer" onClick={handleStart}>
                                        <Sparkles className="w-8 h-8 md:w-14 md:h-14 text-primary animate-pulse group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h2 className="text-3xl md:text-6xl font-black mb-4 tracking-[-0.05em] uppercase italic leading-none">Vibe Check?</h2>
                                    <p className="text-white/40 mb-8 md:mb-12 max-w-[240px] md:max-w-sm text-[10px] md:text-base font-medium leading-relaxed">
                                        Connect with a random stranger instantly. Safe, simple, and pure vibes.
                                    </p>
                                    <Button size="lg" onClick={handleStart} className="rounded-full px-10 md:px-16 h-14 md:h-20 font-black text-sm md:text-xl shadow-[0_0_50px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 transition-all bg-primary">
                                        START VIBING
                                    </Button>
                                </div>
                            )}

                            {session.isMatched && isBlurred && (
                                <div className="glass-card p-8 md:p-14 rounded-[40px] md:rounded-[60px] text-center w-full border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700">
                                    <div className="w-14 h-14 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 md:mb-8">
                                        <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 uppercase tracking-tighter italic">LOCKED IN</h3>
                                    <p className="text-[10px] md:text-sm text-white/40 font-medium mb-8 md:mb-10 tracking-wide uppercase">Ready to reveal the vibe?</p>
                                    <Button onClick={initiateCall} size="lg" className="w-full rounded-3xl shadow-[0_0_30px_rgba(var(--primary),0.3)] h-14 md:h-20 gap-3 md:gap-4 font-black text-sm md:text-2xl bg-primary hover:scale-[1.02] active:scale-95 transition-all">
                                        <Eye className="w-4 h-4 md:w-7 md:h-7" /> REVEAL CHAT
                                    </Button>
                                    <button onClick={handleSkip} className="mt-8 md:mt-10 text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors">
                                        Skip this vibe
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Report Button (Hidden when blurred) */}
                    {session.isMatched && !isBlurred && (
                        <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-40">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleReport}
                                className="bg-black/40 hover:bg-red-500/20 text-white/40 hover:text-red-500 rounded-full h-10 w-10 md:h-16 md:w-16 transition-all border border-white/5 backdrop-blur-xl shadow-2xl"
                                title="Report User"
                            >
                                <Flag className="w-4 h-4 md:w-7 md:h-7" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* 3. PIP & CHAT (Mobile Overlay Layout) */}
                <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end p-4 md:p-10">
                    <div className="flex flex-col-reverse md:flex-row items-end justify-between gap-4">
                        {/* Local Preview (PiP) */}
                        <div className="pointer-events-auto w-24 sm:w-32 md:w-80 aspect-[4/3] relative group">
                            <VideoPanel
                                isLocal
                                className={cn(
                                    "w-full h-full border-2 border-white/10 shadow-2xl rounded-2xl md:rounded-[40px] overflow-hidden bg-black transition-all group-hover:scale-105",
                                    !videoEnabled && "grayscale opacity-50"
                                )}
                            />
                            <div className="absolute top-2 right-2 md:top-5 md:right-5 bg-black/60 backdrop-blur-md text-[6px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-4 py-1 md:py-2 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Preview
                            </div>
                        </div>

                        {/* Floating Chat Box */}
                        <div className="pointer-events-auto w-full md:w-[450px] h-[350px] md:h-[600px] transition-all">
                            <ChatBox />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
