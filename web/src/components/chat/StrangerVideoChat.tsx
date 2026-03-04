"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/hooks/use-socket';
import { VideoPanel } from '@/components/chat/VideoPanel';
import { ChatBox } from '@/components/chat/ChatBox';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Eye, Sparkles, X, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { reportUser } from '@/actions/moderation.actions';

const radarVariants = {
    pulse: {
        scale: [1, 1.5, 2],
        opacity: [0.3, 0.1, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeOut" as any }
    }
};

export function StrangerVideoChat() {
    const session = useChatStore(state => state.session);
    const isSearching = useChatStore(state => state.isSearching);
    const setSearching = useChatStore(state => state.setSearching);
    const disconnect = useChatStore(state => state.disconnect);
    const setMatched = useChatStore(state => state.setMatched);
    const addMessage = useChatStore(state => state.addMessage);

    const { socket } = useSocket();
    const router = useRouter();

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isBlurred, setIsBlurred] = useState(true);
    const retryInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleMatch = useCallback((data: { peerId: string }) => {
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
        toast.info('Stranger disconnected', { description: 'They left the vibe.' });
        disconnect();
        webrtc.resetPeerConnection();
        setIsBlurred(true);
        handleStart();
    }, [disconnect, handleStart]);

    const handleSkip = useCallback(() => {
        if (session.strangerId) {
            socket.emit('skip', { peerId: session.strangerId });
        }
        disconnect();
        webrtc.resetPeerConnection();
        setIsBlurred(true);
        setSearching(true);
    }, [session.strangerId, socket, disconnect, setSearching]);

    const onMessage = useCallback(({ from, content }: { from: string; content: string }) => {
        addMessage({ id: Date.now().toString(), senderId: from, text: content, timestamp: Date.now() });
    }, [addMessage]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('matched', handleMatch);
        socket.on('peerDisconnected', handlePeerDisconnect);
        socket.on('message', onMessage);
        socket.on('skip-cooldown', ({ remaining }: { remaining: number }) => {
            toast.error('Skip Cooldown', { description: `Wait ${remaining}s.` });
        });

        return () => {
            socket.off('matched');
            socket.off('peerDisconnected');
            socket.off('message');
            socket.off('skip-cooldown');
        };
    }, [socket, handleMatch, handlePeerDisconnect, onMessage]);

    // Queue retry interval
    useEffect(() => {
        if (isSearching && !session.isMatched) {
            retryInterval.current = setInterval(() => {
                if (socket.connected) socket.emit('joinQueue');
            }, 10000);
        } else {
            if (retryInterval.current) clearInterval(retryInterval.current);
        }
        return () => {
            if (retryInterval.current) clearInterval(retryInterval.current);
        };
    }, [isSearching, session.isMatched, socket]);

    // Audio/Video toggle
    useEffect(() => { webrtc.toggleAudio(audioEnabled); }, [audioEnabled]);
    useEffect(() => { webrtc.toggleVideo(videoEnabled); }, [videoEnabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { webrtc.cleanup(); };
    }, []);

    const handleClose = () => {
        if (session.strangerId) socket.emit('skip', { peerId: session.strangerId });
        else socket.emit('leaveQueue');
        disconnect();
        webrtc.cleanup();
        router.push('/dms');
    };

    const handleReport = async () => {
        if (session.strangerId) {
            reportUser(session.strangerId, "Inappropriate Behavior")
                .then(() => toast.success('User Reported'))
                .catch(console.error);
        }
        handleSkip();
    };

    const handleReveal = () => {
        if (session.strangerId) {
            webrtc.initiateOffer(session.strangerId);
            setIsBlurred(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
            {/* Header */}
            <header className="absolute top-6 inset-x-0 h-20 md:h-24 z-50 px-4 md:px-10 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-2xl glass h-12 w-12 md:h-14 md:w-14">
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <div className="glass px-4 md:px-8 py-2 md:py-3.5 rounded-full flex items-center gap-4 shadow-2xl border border-border/10 bg-muted/30 backdrop-blur-xl">
                        <div className="flex items-center pr-4 border-r border-border/10">
                            <motion.div
                                animate={isSearching ? { opacity: [0.3, 0.8, 0.3] } : {}}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    isSearching ? "bg-primary" : session.isMatched ? "bg-emerald-500" : "bg-muted-foreground/20"
                                )}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground/60">
                            <button onClick={() => setAudioEnabled(!audioEnabled)}>
                                {audioEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                            </button>
                            <button onClick={() => setVideoEnabled(!videoEnabled)}>
                                {videoEnabled ? <VideoIcon className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto">
                    <Button
                        onClick={isSearching ? () => { socket.emit('leaveQueue'); disconnect(); } : handleSkip}
                        disabled={isSearching && !session.isMatched}
                        className="rounded-2xl px-6 md:px-10 h-12 md:h-14 font-black uppercase tracking-widest text-xs shadow-glow bg-primary"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isSearching ? "Scanning" : "Skip"}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                {/* Full-screen remote video */}
                <div className="absolute inset-0 z-10 bg-black overflow-hidden">
                    <VideoPanel
                        isMatched={session.isMatched}
                        className={cn(
                            "w-full h-full border-none rounded-none aspect-auto shadow-none bg-transparent transition-all duration-1000",
                            isBlurred && session.isMatched && "blur-2xl scale-110 opacity-40"
                        )}
                    />

                    <AnimatePresence mode="wait">
                        {/* START STATE */}
                        {!session.isMatched && !isSearching && (
                            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                <div className="pointer-events-auto flex flex-col items-center">
                                    <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter uppercase italic text-white drop-shadow-2xl">Vibe Check?</h2>
                                    <Button size="lg" onClick={handleStart} className="rounded-full px-20 h-24 font-black text-2xl shadow-glow bg-primary">START VIBING</Button>
                                </div>
                            </motion.div>
                        )}

                        {/* SEARCHING STATE */}
                        {isSearching && !session.isMatched && (
                            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-30">
                                <div className="relative">
                                    <motion.div variants={radarVariants} animate="pulse" className="absolute inset-0 border-4 border-primary rounded-full" />
                                    <div className="w-40 h-40 md:w-48 md:h-48 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 backdrop-blur-3xl relative z-10">
                                        <Zap className="w-10 h-10 text-primary animate-pulse" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* LOCKED IN (REVEAL) STATE */}
                        {session.isMatched && isBlurred && (
                            <motion.div key="reveal" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex items-center justify-center z-[60] px-6 pointer-events-auto">
                                <div className="glass-card p-12 rounded-[50px] text-center w-full max-w-sm shadow-glow-lg flex flex-col items-center bg-card/90 border-white/10">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-[24px] flex items-center justify-center mb-8 rotate-12">
                                        <Sparkles className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h3 className="text-4xl font-black mb-3 uppercase italic tracking-tighter">LOCKED IN</h3>
                                    <p className="text-sm text-muted-foreground/60 mb-8">Ready to see your vibe match?</p>
                                    <Button onClick={handleReveal} className="w-full h-20 rounded-3xl font-black text-2xl bg-primary text-primary-foreground shadow-glow gap-3">
                                        <Eye className="w-7 h-7" /> REVEAL
                                    </Button>
                                    <button onClick={handleSkip} className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors">
                                        Skip this vibe
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* PIP + ChatBox overlay */}
                <div className="absolute inset-0 z-40 flex flex-col justify-end p-6 md:p-12 overflow-hidden pointer-events-none">
                    <div className="w-full h-full flex flex-col md:flex-row items-end justify-between gap-6">
                        {/* Local PIP */}
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pointer-events-auto w-32 md:w-80 aspect-[4/3] shrink-0">
                            <VideoPanel isLocal className={cn("w-full h-full border border-white/5 rounded-3xl", !videoEnabled && "grayscale opacity-50")} />
                        </motion.div>

                        {/* Chat */}
                        {session.isMatched && !isBlurred && (
                            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pointer-events-auto w-full md:w-[460px] h-[320px] md:h-[650px]">
                                <ChatBox onReport={handleReport} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
