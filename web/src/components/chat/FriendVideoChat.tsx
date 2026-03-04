"use client";

import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/hooks/use-socket';
import { VideoPanel } from '@/components/chat/VideoPanel';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, X, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { webrtc } from '@/lib/webrtc';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export function FriendVideoChat() {
    const session = useChatStore(state => state.session);
    const disconnect = useChatStore(state => state.disconnect);
    const { socket } = useSocket();
    const router = useRouter();

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const handleClose = useCallback(() => {
        if (session.strangerId) {
            socket?.emit('hang-up', { to: session.strangerId });
        }
        disconnect();
        webrtc.cleanup();
        router.push('/dms');
    }, [disconnect, router, session.strangerId, socket]);

    // Peer disconnect listener
    useEffect(() => {
        if (!socket) return;

        const onHangUp = () => {
            handleClose();
        };

        socket.on('hang-up', onHangUp);
        socket.on('peerDisconnected', onHangUp);
        return () => {
            socket.off('hang-up', onHangUp);
            socket.off('peerDisconnected', onHangUp);
        };
    }, [socket, handleClose]);

    // WebRTC handshake: initiator sends offer
    useEffect(() => {
        if (session.isMatched && session.isInitiator && session.strangerId) {
            console.log("[FriendChat] I am the initiator. Sending offer in 1s...");
            const timer = setTimeout(() => {
                webrtc.initiateOffer(session.strangerId!);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [session.isMatched, session.isInitiator, session.strangerId]);

    // Audio/Video toggle
    useEffect(() => { webrtc.toggleAudio(audioEnabled); }, [audioEnabled]);
    useEffect(() => { webrtc.toggleVideo(videoEnabled); }, [videoEnabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { webrtc.cleanup(); };
    }, []);

    return (
        <div className="h-screen w-full flex flex-col bg-[#050505] text-white selection:bg-primary/50 transition-colors duration-1000 relative overflow-hidden">
            {/* Header */}
            <header className="absolute top-8 inset-x-0 h-20 md:h-24 z-[70] px-6 md:px-12 flex items-center justify-center pointer-events-none">
                <div className="w-full max-w-[1700px] flex items-center justify-between">
                    <div className="w-20 hidden md:block" /> {/* Spacing */}

                    <div className="pointer-events-auto">
                        <div className="px-6 md:px-10 py-3 md:py-4 rounded-[2rem] flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/10 backdrop-blur-3xl border border-white/5">
                            <div className="flex items-center gap-5">
                                <button onClick={() => setAudioEnabled(!audioEnabled)} className={cn("p-2 transition-all", !audioEnabled && "text-red-500")}>
                                    {audioEnabled ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5" />}
                                </button>
                                <button onClick={() => setVideoEnabled(!videoEnabled)} className={cn("p-2 transition-all", !videoEnabled && "text-red-500")}>
                                    {videoEnabled ? <VideoIcon className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pointer-events-auto">
                        <Button onClick={handleClose} className="rounded-3xl px-8 md:px-12 h-14 md:h-16 font-black uppercase tracking-widest text-[11px] shadow-[0_20px_40px_rgba(239,68,68,0.2)] bg-red-500 hover:bg-red-600 border-none transition-all hover:scale-105 active:scale-95">
                            END VIBE
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 relative flex items-center justify-center p-6 md:p-12 gap-6 md:gap-10">
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[180px] opacity-40 animate-pulse" />
                </div>

                <div className="w-full h-full max-w-[1700px] flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center pt-24 md:pt-32 relative z-10 overflow-hidden">
                    {/* LOCAL */}
                    <motion.div
                        initial={{ x: -60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="w-full md:w-[48%] h-[40vh] md:h-full max-h-[85vh] rounded-[60px] md:rounded-[80px] overflow-hidden shadow-[0_60px_100px_rgba(0,0,0,0.9)] border border-white/5 group relative"
                    >
                        <VideoPanel isLocal className={cn("w-full h-full border-none transition-transform duration-700 group-hover:scale-[1.02]", !videoEnabled && "grayscale opacity-40")} />
                        <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-white/50 italic">You (Exclusive)</p>
                        </div>
                    </motion.div>

                    {/* REMOTE */}
                    <motion.div
                        initial={{ x: 60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                        className="w-full md:w-[48%] h-[40vh] md:h-full max-h-[85vh] rounded-[60px] md:rounded-[80px] overflow-hidden shadow-[0_60px_100px_rgba(0,0,0,0.9)] border border-white/5 group relative"
                    >
                        <VideoPanel isMatched={session.isMatched} className="w-full h-full border-none transition-transform duration-700 group-hover:scale-[1.02]" />
                        <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/40 to-transparent flex justify-between items-end">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{session.peerName || 'Buddy'}</h3>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80 leading-none">Vibe Established</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-3xl backdrop-blur-3xl border border-white/5">
                                <ShieldCheck className="w-8 h-8 text-emerald-500/30" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
