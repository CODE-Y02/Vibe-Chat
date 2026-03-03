"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/hooks/use-socket';
import { VideoPanel } from '@/components/chat/VideoPanel';
import { ChatBox } from '@/components/chat/ChatBox';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Flag, Eye, Sparkles, X, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { useRouter } from 'next/navigation';
import { useSession } from "@/components/layout/SessionProvider";
import { motion, AnimatePresence } from 'framer-motion';
import { reportUser } from '@/actions/moderation.actions';

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
    const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. STABLE CALLBACKS
    // ──────────────────────────────────────────────────────────────────────────
    const handleMatch = useCallback((data: { peerId: string, peerName?: string, peerAvatar?: string }) => {
        setMatched("anonymous-room", data.peerId, "Stranger", "");
        setIsBlurred(true);
        toast({ title: 'Matched!', description: 'Say hello to your new vibe buddy.' });
    }, [setMatched, toast]);

    const handleStart = useCallback(() => {
        setSearching(true);
        socket.emit('joinQueue');
        toast({ title: 'Searching...', description: 'Finding a vibe for you.' });
    }, [setSearching, socket, toast]);

    const handlePeerDisconnect = useCallback(() => {
        toast({ title: 'Stranger disconnected', description: 'They left the vibe.' });
        disconnect();
        webrtc.cleanup();
        setIsBlurred(true);
        // Immediately start searching for a new match
        handleStart();
    }, [disconnect, toast, handleStart]);

    const handleSkip = useCallback(() => {
        console.log("[UI] Skipping match...");
        if (session.strangerId) {
            socket.emit('skip', { peerId: session.strangerId });
        }
        disconnect();
        webrtc.cleanup();
        setIsBlurred(true);
        handleStart();
    }, [session.strangerId, socket, disconnect, handleStart]);

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
        if (status !== 'authenticated' || !sessionData?.session?.access_token || !socket) return;

        console.log("[ChatPage] Lifecycle: Initializing match state...");
        socket.auth = { token: sessionData.session.access_token };

        // Reconnect if needed
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            console.log("[ChatPage] Lifecycle Cleanup: Clearing chat state...");
            disconnect(); // Clear local chat store
            webrtc.cleanup(); // Clean up media
        };
    }, [status, socket, disconnect, sessionData?.session?.access_token]);

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
    }, [status, handleMatch, handlePeerDisconnect, onMessage, router, toast, disconnect, socket]);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. INTERVALS (Search Retry)
    // ──────────────────────────────────────────────────────────────────────────
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
    }, [status, isSearching, session.isMatched, socket]);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. UI ACTIONS
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        webrtc.toggleAudio(audioEnabled);
    }, [audioEnabled]);

    useEffect(() => {
        webrtc.toggleVideo(videoEnabled);
    }, [videoEnabled]);

    const handleClose = () => {
        socket.emit('leaveQueue');
        disconnect();
        webrtc.cleanup();
        router.push('/dms');
    };

    const handleReport = async () => {
        if (session.strangerId) {
            toast({ title: 'Reporting...', description: 'Please wait.' });
            await reportUser(session.strangerId, "Inappropriate Behavior").catch(console.error);
            toast({ title: 'User Reported', description: 'Thank you for keeping VibeChat safe.', variant: 'destructive' });
        }
        handleSkip();
    };

    const initiateCall = async () => {
        if (session.strangerId) {
            await webrtc.initiateOffer(session.strangerId);
            setIsBlurred(false);
        }
    };

    const radarVariants = {
        pulse: {
            scale: [1, 1.5, 2],
            opacity: [0.5, 0.2, 0],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeOut" as any
            }
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
                        className="rounded-2xl glass hover:bg-white/10 h-12 w-12 md:h-14 md:w-14 transition-all"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </Button>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <div className="glass px-4 md:px-8 py-2 md:py-3.5 rounded-full flex items-center gap-4 shadow-2xl transition-all">
                        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                            <motion.div
                                animate={isSearching ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    isSearching ? "bg-primary glow-sm" : session.isMatched ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-white/20"
                                )}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                {isSearching ? "Searching" : session.isMatched ? "Live" : "Standby"}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-white/40">
                            <button onClick={() => setAudioEnabled(!audioEnabled)} className={cn("transition-colors hover:text-white", !audioEnabled && "text-red-500")}>
                                {audioEnabled ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
                            </button>
                            <button onClick={() => setVideoEnabled(!videoEnabled)} className={cn("transition-colors hover:text-white", !videoEnabled && "text-red-500")}>
                                {videoEnabled ? <VideoIcon className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto">
                    <Button
                        onClick={isSearching ? () => { socket.emit('leaveQueue'); disconnect(); } : handleSkip}
                        className="rounded-2xl px-6 md:px-10 h-12 md:h-14 font-black uppercase tracking-widest text-xs bg-white text-black hover:scale-105 active:scale-95 shadow-glow-lg transition-all"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Skip"}
                    </Button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                {/* VIDEO ZONE */}
                <div className="flex-1 relative bg-[#050505] overflow-hidden">
                    <VideoPanel
                        isMatched={session.isMatched}
                        className={cn(
                            "w-full h-full border-none rounded-none aspect-auto shadow-none bg-transparent transition-all duration-1000",
                            isBlurred && session.isMatched && "blur-[80px] scale-110 opacity-40 animate-pulse"
                        )}
                    />

                    {/* OVERLAYS */}
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
                                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                    </motion.div>
                                    <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-[-0.05em] uppercase italic leading-none text-gradient">Vibe Check?</h2>
                                    <p className="text-white/40 mb-12 max-w-sm text-sm md:text-base font-medium leading-relaxed uppercase tracking-widest">
                                        Secure · Ephemeral · Global
                                    </p>
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
                                    <motion.div variants={radarVariants} animate="pulse" transition={{ delay: 0.5 }} className="absolute inset-0 border-2 border-primary rounded-full" />
                                    <motion.div variants={radarVariants} animate="pulse" transition={{ delay: 1 }} className="absolute inset-0 border-2 border-primary rounded-full" />

                                    <div className="w-32 h-32 md:w-48 md:h-48 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 relative z-10 backdrop-blur-xl">
                                        <div className="flex flex-col items-center gap-3">
                                            <Zap className="w-8 h-8 text-primary animate-pulse" />
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
                                <div className="glass-card p-10 md:p-16 rounded-[48px] text-center w-full max-w-md shadow-glow-lg flex flex-col items-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/20 rounded-[24px] flex items-center justify-center mb-10 rotate-12">
                                        <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                                    </div>
                                    <h3 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter italic text-gradient">LOCKED IN</h3>
                                    <p className="text-xs text-white/40 font-bold mb-10 tracking-[0.2em] uppercase">Vibe match detected</p>
                                    <Button onClick={initiateCall} size="lg" className="w-full rounded-2xl shadow-glow h-20 gap-4 font-black text-2xl bg-primary hover:scale-[1.02] active:scale-95 transition-all">
                                        <Eye className="w-7 h-7" /> REVEAL
                                    </Button>
                                    <button onClick={handleSkip} className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors">
                                        Skip this vibe
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Report Button */}
                    {session.isMatched && !isBlurred && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute bottom-10 right-10 z-40"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleReport}
                                className="glass hover:bg-red-500/20 text-white/40 hover:text-red-500 rounded-2xl h-14 w-14 transition-all"
                                title="Report User"
                            >
                                <Flag className="w-6 h-6" />
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* PiP & CHAT */}
                <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end p-6 md:p-12">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-4 md:gap-6 w-full">
                        {/* Local Preview */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="pointer-events-auto w-32 sm:w-44 md:w-80 aspect-[4/3] relative group shrink-0"
                        >
                            <VideoPanel
                                isLocal
                                className={cn(
                                    "w-full h-full border border-white/20 shadow-glow rounded-3xl overflow-hidden bg-black transition-all group-hover:scale-105",
                                    !videoEnabled && "grayscale opacity-50"
                                )}
                            />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/80">You</span>
                            </div>
                        </motion.div>

                        {/* Chat Box */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className={cn(
                                "pointer-events-auto w-full md:w-[460px] h-[320px] md:h-[650px] transition-all",
                                !session.isMatched && "hidden md:flex"
                            )}
                        >
                            <ChatBox onReport={handleReport} />
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}

