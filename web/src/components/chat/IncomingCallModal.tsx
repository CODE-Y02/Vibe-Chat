"use client";

import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, Video, Volume2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function IncomingCallModal() {
    const incomingCall = useChatStore(state => state.incomingCall);
    const setIncomingCall = useChatStore(state => state.setIncomingCall);
    const setMatched = useChatStore(state => state.setMatched);
    const isMatched = useChatStore(state => state.session.isMatched);
    const router = useRouter();
    const [audioAllowed, setAudioAllowed] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (incomingCall && !isMatched) {
            const sources = [
                "https://cdn.pixabay.com/audio/2021/08/04/audio_c686129486.mp3",
                "https://cdn.pixabay.com/audio/2022/03/10/audio_f9c6d691e5.mp3",
                "https://assets.mixkit.co/active_storage/sfx/824/824-preview.mp3"
            ];

            let currentIndex = 0;
            const playWithFallback = () => {
                if (currentIndex >= sources.length) {
                    console.error("[Call] All ringtone sources failed");
                    return;
                }

                const ring = new Audio(sources[currentIndex]);
                ring.loop = true;
                audioRef.current = ring;

                ring.play()
                    .then(() => setAudioAllowed(true))
                    .catch((err) => {
                        console.warn(`[Call] Play failed for source ${currentIndex}:`, err.name);
                        if (err.name === "NotAllowedError") {
                            setAudioAllowed(false);
                        } else {
                            currentIndex++;
                            playWithFallback();
                        }
                    });

                ring.onerror = () => {
                    console.warn(`[Call] Load failed for source ${currentIndex}`);
                    currentIndex++;
                    playWithFallback();
                };
            };

            playWithFallback();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [incomingCall, isMatched]);

    if (!incomingCall || isMatched) return null;

    const handleAccept = () => {
        if (audioRef.current) audioRef.current.pause();
        console.log("[IncomingCall] Accepting call from:", incomingCall.from);
        socket.emit("call-accepted", { to: incomingCall.from });
        setMatched("direct-room", incomingCall.from, incomingCall.fromName, incomingCall.fromAvatar, true, false);
        setIncomingCall(null);
        router.push("/chat");
    };

    const handleDecline = () => {
        if (audioRef.current) audioRef.current.pause();
        console.log("[IncomingCall] Declining call from:", incomingCall.from);
        socket.emit("reject-call", { to: incomingCall.from });
        setIncomingCall(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden p-6">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,var(--primary),transparent_70%)] animate-pulse" />

            <div className="glass-card w-full max-w-sm rounded-[60px] p-12 text-center border border-white/10 shadow-[0_0_120px_rgba(34,197,94,0.3)] flex flex-col items-center bg-white/5 relative">
                {!audioAllowed && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-primary text-[8px] font-black uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full">
                        <Volume2 className="w-3 h-3" /> Tap to hear ring
                    </div>
                )}

                <div className="relative mb-12">
                    <Avatar className="w-32 h-32 border-4 border-emerald-500 shadow-2xl scale-110">
                        <AvatarImage src={incomingCall.fromAvatar} />
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400 font-black text-4xl italic">
                            {incomingCall.fromName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full border-4 border-emerald-500/40"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.5)]">
                        <Video className="w-6 h-6 text-white" />
                    </div>
                </div>

                <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight italic leading-none">{incomingCall.fromName}</h2>
                <div className="flex items-center gap-2 mb-12">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
                    <p className="text-emerald-500/60 font-black uppercase tracking-[0.4em] text-[9px]">Secured Friendship Vibe</p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <Button
                        onClick={handleAccept}
                        className="w-full h-20 rounded-[2.5rem] gap-4 font-black text-lg uppercase bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 hover:scale-[1.03] active:scale-95 transition-all text-white border-none"
                    >
                        <Video className="w-6 h-6" /> Pick Up
                    </Button>
                    <Button
                        onClick={handleDecline}
                        variant="ghost"
                        className="w-full h-16 rounded-[2rem] gap-3 font-bold text-xs uppercase text-white/40 hover:text-white/80 hover:bg-white/5"
                    >
                        <PhoneOff className="w-4 h-4" /> Not now
                    </Button>
                </div>
            </div>
        </div>
    );
}
