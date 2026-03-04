"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/hooks/use-socket';
import { VideoPanel } from '@/components/chat/VideoPanel';
import { ChatBox } from '@/components/chat/ChatBox';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Flag, Eye, Sparkles, X, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { useRouter } from 'next/navigation';
import { useSession } from "@/components/layout/SessionProvider";
import { motion, AnimatePresence } from 'framer-motion';
import { reportUser } from '@/actions/moderation.actions';

const radarVariants = {
    pulse: {
        scale: [1, 1.5, 2],
        opacity: [0.3, 0.1, 0],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeOut" as any
        }
    }
};

export default function ChatPage() {
    const session = useChatStore(state => state.session);
    const isSearching = useChatStore(state => state.isSearching);
    const setSearching = useChatStore(state => state.setSearching);
    const disconnect = useChatStore(state => state.disconnect);
    const setMatched = useChatStore(state => state.setMatched);
    const addMessage = useChatStore(state => state.addMessage);
    const incomingCall = useChatStore(state => state.incomingCall);
    const setIncomingCall = useChatStore(state => state.setIncomingCall);
    
    const { data: sessionData, status } = useSession();
    const { socket } = useSocket();
    const router = useRouter();

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isBlurred, setIsBlurred] = useState(true);

    const retryInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleMatch = useCallback((data: { peerId: string, peerName?: string, peerAvatar?: string }) => {
        setMatched("anonymous-room", data.peerId, "Stranger", "");
        setIsBlurred(true);
        toast.success('Matched!', { description: 'Say hello to your new vibe buddy.' });
    }, [setMatched]);

    const handleStart = useCallback(() => {
        setSearching(true);
        socket.emit('joinQueue');
        toast.info('Searching...', { description: 'Finding a vibe for you.' });
    }, [setSearching, socket]);

    const handlePeerDisconnect = useCallback(() => {
        toast.info(`${session.isDirectCall ? (session.peerName || 'Friend') : 'Stranger'} disconnected`, { description: 'They left the vibe.' });
        
        if (session.isDirectCall) {
            disconnect();
            webrtc.cleanup();
            router.push('/dms');
        } else {
            disconnect();
            webrtc.resetPeerConnection();
            setIsBlurred(true);
            handleStart();
        }
    }, [disconnect, handleStart, session.isDirectCall, session.peerName, router]);

    const handleSkip = useCallback(() => {
        if (session.strangerId) {
            socket.emit('skip', { peerId: session.strangerId });
        }
        
        if (session.isDirectCall) {
            disconnect();
            webrtc.cleanup();
            router.push('/dms');
        } else {
            disconnect();
            webrtc.resetPeerConnection();
            setIsBlurred(true);
            setSearching(true);
        }
    }, [session.strangerId, session.isDirectCall, socket, disconnect, setSearching, router]);

    const onMessage = useCallback(({ from, content }: { from: string, content: string }) => {
        addMessage({
            id: Date.now().toString(),
            senderId: from,
            text: content,
            timestamp: Date.now()
        });
    }, [addMessage]);

    const handleIncomingDM = useCallback(({ senderId, content }: { senderId: string, content: string }) => {
        if (session.strangerId === senderId) {
            onMessage({ from: senderId, content });
        }
    }, [session.strangerId, onMessage]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated' || !sessionData?.session?.access_token || !socket) return;
        
        // Note: Global connection is now managed by SocketManager
        if (!socket.connected) socket.connect();

        // 🟢 INITIATE CALL (If we are the one who started the call)
        if (session.isDirectCall && session.isMatched && session.isInitiator && session.strangerId) {
            console.log("[ChatPage] Initiating friend call handshake...");
            // Small delay to ensure both peers are on the chat page and ready
            const timer = setTimeout(() => {
                webrtc.initiateOffer(session.strangerId!);
            }, 1000);
            return () => clearTimeout(timer);
        }

        return () => {
            disconnect(); 
            webrtc.cleanup();
        };
    }, [status, socket, disconnect, sessionData?.session?.access_token]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        socket.on('matched', handleMatch);
        socket.on('peerDisconnected', handlePeerDisconnect);
        socket.on('message', onMessage);
        socket.on('dm', handleIncomingDM);

        socket.on('call-rejected', () => {
            toast.error('Call rejected');
            disconnect();
            router.push('/dms');
        });

        socket.on('answer-made', async ({ answer }: { answer: any }) => {
            await webrtc.handleAnswer(answer);
        });

        socket.on('offer', async ({ from, sdp }: { from: string, sdp: any }) => {
            await webrtc.handleOffer(from, sdp);
        });

        socket.on('answer', async ({ sdp }: { sdp: any }) => {
            await webrtc.handleAnswer(sdp);
        });

        socket.on('iceCandidate', async ({ candidate }: { candidate: any }) => {
            await webrtc.handleIceCandidate(candidate);
        });

        socket.on('skip-cooldown', ({ remaining }: { remaining: number }) => {
            toast.error('Skip Cooldown', { 
                description: `You're skipping too fast. Wait ${remaining}s.`,
            });
        });

        return () => {
            socket.off('matched');
            socket.off('peerDisconnected');
            socket.off('message');
            socket.off('dm');
            socket.off('call-rejected');
            socket.off('answer-made');
            socket.off('offer');
            socket.off('answer');
            socket.off('iceCandidate');
            socket.off('skip-cooldown');
        };
    }, [status, handleMatch, handlePeerDisconnect, onMessage, router, disconnect, socket]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        if (isSearching && !session.isMatched) {
            retryInterval.current = setInterval(() => {
                if (socket.connected) {
                    socket.emit('joinQueue');
                }
            }, 10000);
        } else {
            if (retryInterval.current) clearInterval(retryInterval.current);
        }

        return () => {
            if (retryInterval.current) clearInterval(retryInterval.current);
        };
    }, [status, isSearching, session.isMatched, socket]);

    useEffect(() => {
        webrtc.toggleAudio(audioEnabled);
    }, [audioEnabled]);

    useEffect(() => {
        webrtc.toggleVideo(videoEnabled);
    }, [videoEnabled]);

    const handleClose = () => {
        if (session.strangerId) {
            socket.emit('skip', { peerId: session.strangerId });
        } else {
            socket.emit('leaveQueue');
        }
        disconnect();
        webrtc.cleanup();
        router.push('/dms');
    };

    const handleReport = async () => {
        if (session.strangerId) {
            const reportPromise = reportUser(session.strangerId, "Inappropriate Behavior");
            toast.promise(reportPromise, {
                loading: 'Reporting...',
                success: 'User Reported.',
                error: 'Failed to report user.'
            });
            await reportPromise.catch(console.error);
        }
        handleSkip();
    };

    const initiateCall = async () => {
        if (session.strangerId) {
            await webrtc.initiateOffer(session.strangerId);
            setIsBlurred(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary/30 overflow-hidden relative transition-colors duration-300">
            {/* 1. HEADER */}
            <header className="absolute top-6 inset-x-0 h-20 md:h-24 z-50 px-4 md:px-10 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-2xl glass hover:bg-muted/50 h-12 w-12 md:h-14 md:w-14 transition-all"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                    </Button>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <div className="glass px-4 md:px-8 py-2 md:py-3.5 rounded-full flex items-center gap-4 shadow-2xl transition-all border border-border/10 bg-muted/30 backdrop-blur-xl">
                        <div className="flex items-center gap-3 pr-4 border-r border-border/10">
                            <motion.div
                                animate={isSearching ? { opacity: [0.3, 0.8, 0.3] } : {}}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    isSearching ? "bg-primary shadow-[0_0_10px_hsla(var(--primary)/0.3)]" : session.isMatched ? "bg-emerald-500 shadow-[0_0_10px_hsla(142,71%,45%,0.5)]" : "bg-muted-foreground/20"
                                )}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                                {isSearching ? "Searching" : session.isMatched ? "Live" : "Standby"}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground/60">
                            <button onClick={() => setAudioEnabled(!audioEnabled)} className={cn("transition-colors hover:text-foreground", !audioEnabled && "text-red-500")}>
                                {audioEnabled ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
                            </button>
                            <button onClick={() => setVideoEnabled(!videoEnabled)} className={cn("transition-colors hover:text-foreground", !videoEnabled && "text-red-500")}>
                                {videoEnabled ? <VideoIcon className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto">
                    <Button
                        onClick={session.isDirectCall ? handleClose : (isSearching ? () => { socket.emit('leaveQueue'); disconnect(); } : handleSkip)}
                        disabled={isSearching && !session.isDirectCall}
                        className={cn(
                            "rounded-2xl px-6 md:px-10 h-12 md:h-14 font-black uppercase tracking-widest text-xs transition-all shadow-glow-lg",
                            session.isDirectCall ? "bg-red-500 text-white hover:bg-red-600" : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                        )}
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : (session.isDirectCall ? "End Call" : "Skip")}
                    </Button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                {/* 1. LAYER: MAIN REMOTE VIDEO (FOR STRANGERS) */}
                {!session.isDirectCall && (
                    <div className="absolute inset-0 z-10 bg-background overflow-hidden dark">
                        <VideoPanel
                            isMatched={session.isMatched}
                            className={cn(
                                "w-full h-full border-none rounded-none aspect-auto shadow-none bg-transparent transition-all duration-1000",
                                isBlurred && session.isMatched && "blur-2xl scale-110 opacity-40"
                            )}
                        />
                        
                        {/* OVERLAYS FOR STRANGER FLOW */}
                        <AnimatePresence mode="wait">
                            {!session.isMatched && !isSearching && (
                                <motion.div
                                    key="start-state"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-4"
                                >
                                    <div className="pointer-events-auto flex flex-col items-center text-center">
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 10 }}
                                            onClick={handleStart}
                                            className="w-24 h-24 md:w-32 md:h-32 bg-primary/20 rounded-full flex items-center justify-center mb-10 border border-primary/30 shadow-glow-lg group cursor-pointer relative"
                                        >
                                            <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-primary group-hover:scale-110 transition-transform" />
                                        </motion.div>
                                        <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-[-0.05em] uppercase italic leading-none text-gradient">Vibe Check?</h2>
                                        <Button size="lg" onClick={handleStart} className="rounded-full px-16 h-20 font-black text-xl shadow-glow transition-all bg-primary hover:scale-105 active:scale-95">
                                            START VIBING
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {isSearching && !session.isMatched && (
                                <motion.div
                                    key="searching-state"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center z-30"
                                >
                                    <div className="relative">
                                        <motion.div variants={radarVariants} animate="pulse" className="absolute inset-0 border-2 border-primary rounded-full" />
                                        <div className="w-32 h-32 md:w-48 md:h-48 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 relative z-10 backdrop-blur-xl">
                                            <div className="flex flex-col items-center gap-3">
                                                <Zap className="w-8 h-8 text-primary shadow-glow-sm" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Scanning...</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {session.isMatched && isBlurred && (
                                <motion.div
                                    key="locked-state"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 flex items-center justify-center z-[60] px-6 pointer-events-auto"
                                >
                                    <div className="glass-card p-10 md:p-16 rounded-[48px] text-center w-full max-w-md shadow-glow-lg flex flex-col items-center bg-card/80 backdrop-blur-3xl border-border/10">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/20 rounded-[24px] flex items-center justify-center mb-10 rotate-12">
                                            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter italic text-gradient">LOCKED IN</h3>
                                        <Button onClick={initiateCall} size="lg" className="w-full rounded-2xl shadow-glow h-20 gap-4 font-black text-2xl bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all">
                                            <Eye className="w-7 h-7" /> REVEAL
                                        </Button>
                                        <button onClick={handleSkip} className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors">
                                            Skip this vibe
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* 2. LAYER: INTERACTIVE UI (PIP + LOUNGE + CHAT) */}
                <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end p-6 md:p-12 overflow-hidden">
                    <div className={cn(
                        "w-full h-full flex transition-all duration-500",
                        session.isDirectCall ? "flex-col md:flex-row gap-8 items-center justify-center pt-24" : "flex-col md:flex-row items-end justify-between gap-4 md:gap-6"
                    )}>
                        {/* LOCAL PANEL */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className={cn(
                                "pointer-events-auto relative group shrink-0 transition-all duration-500",
                                session.isDirectCall 
                                    ? "w-full md:w-[45%] h-[35vh] md:h-[60vh] max-h-[80vh] shadow-glow-lg" 
                                    : "w-32 sm:w-44 md:w-80 aspect-[4/3]"
                            )}
                        >
                            <VideoPanel
                                isLocal
                                className={cn(
                                    "w-full h-full border border-border/20 shadow-glow overflow-hidden bg-background transition-all group-hover:scale-[1.02]",
                                    session.isDirectCall ? "rounded-[40px]" : "rounded-3xl",
                                    !videoEnabled && "grayscale opacity-50"
                                )}
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">You</span>
                            </div>
                        </motion.div>

                        {/* REMOTE PANEL (FOR LOUNGE MODE ONLY) */}
                        {session.isDirectCall && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="pointer-events-auto relative group shrink-0 w-full md:w-[45%] h-[35vh] md:h-[60vh] max-h-[80vh] transition-all duration-500"
                            >
                                <VideoPanel
                                    isMatched={session.isMatched}
                                    className={cn(
                                        "w-full h-full border border-border/20 shadow-glow rounded-[40px] overflow-hidden bg-background transition-all group-hover:scale-[1.02]",
                                        isBlurred && "blur-2xl opacity-40"
                                    )}
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{session.peerName || 'Friend'}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* CHAT BOX (FOR STRANGER MODE ONLY) */}
                        {!session.isDirectCall && session.isMatched && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="pointer-events-auto w-full md:w-[460px] h-[320px] md:h-[650px] transition-all"
                            >
                                <ChatBox onReport={handleReport} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
