"use client";

import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, ShieldCheck, Zap } from "lucide-react";
import { socket } from "@/lib/socket";
import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function OutgoingCallModal() {
    const outgoingCall = useChatStore(state => state.outgoingCall);
    const setOutgoingCall = useChatStore(state => state.setOutgoingCall);

    // ✅ FIX: Use ref to always have current outgoingCall in callbacks
    const outgoingCallRef = useRef(outgoingCall);
    useEffect(() => { outgoingCallRef.current = outgoingCall; }, [outgoingCall]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ✅ FIX: Stable cancel function using ref
    const handleCancel = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        const call = outgoingCallRef.current;
        if (call) {
            socket.emit("cancel-call", { to: call.to });
        }
        setOutgoingCall(null);
    }, [setOutgoingCall]);

    useEffect(() => {
        if (!outgoingCall) return;

        // Play outgoing ring sound
        const ring = new Audio("https://cdn.pixabay.com/audio/2022/10/30/audio_b29267a57a.mp3");
        ring.loop = true;
        ring.volume = 0.4;
        audioRef.current = ring;
        ring.play().catch(() => console.log("[Call] Autoplay deferred"));

        // ✅ FIX: Guard — only emit if socket is connected
        if (socket.connected) {
            console.log("[OutgoingCall] Emitting make-call to:", outgoingCall.to);
            socket.emit("make-call", { to: outgoingCall.to });
        } else {
            console.warn("[OutgoingCall] Socket not connected, waiting for reconnect...");
            const onConnect = () => {
                console.log("[OutgoingCall] Socket reconnected, emitting make-call");
                socket.emit("make-call", { to: outgoingCallRef.current?.to });
                socket.off("connect", onConnect);
            };
            socket.on("connect", onConnect);
        }

        // 45s timeout
        const timer = setTimeout(() => {
            toast.error("No Answer", { description: "Your friend didn't pick up." });
            handleCancel();
        }, 45000);

        return () => {
            clearTimeout(timer);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [outgoingCall, handleCancel]);

    if (!outgoingCall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-3xl overflow-hidden p-6">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,var(--primary),transparent_70%)] animate-pulse" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                className="glass-card w-full max-w-sm rounded-[60px] p-12 text-center border border-white/10 shadow-[0_40px_120px_rgba(var(--primary),0.3)] flex flex-col items-center bg-white/5 relative"
            >
                <div className="relative mb-12">
                    <Avatar className="w-32 h-32 border-4 border-primary shadow-2xl scale-110">
                        <AvatarImage src={outgoingCall.toAvatar} />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-4xl italic">
                            {outgoingCall.toName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full border-4 border-primary/40"
                    />
                    <div className="absolute -bottom-2 -left-2 bg-primary p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(243,75,59,0.5)]">
                        <Zap className="w-5 h-5 text-white animate-bounce" />
                    </div>
                </div>

                <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight italic leading-none">{outgoingCall.toName}</h1>
                <div className="flex items-center gap-2 mb-12">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary/60" />
                    <p className="text-primary/60 font-black uppercase tracking-[0.4em] text-[8px]">Requesting Exclusive Vibe</p>
                </div>

                <div className="mb-12 h-6 flex items-center gap-1">
                    <motion.div animate={{ height: [4, 20, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 bg-primary/40 rounded-full" />
                    <motion.div animate={{ height: [8, 24, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 bg-primary/70 rounded-full" />
                    <motion.div animate={{ height: [4, 20, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 bg-primary/40 rounded-full" />
                </div>

                <Button
                    onClick={handleCancel}
                    variant="destructive"
                    className="w-full h-20 rounded-[2.5rem] gap-4 font-black text-lg uppercase bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 hover:scale-[1.03] active:scale-95 transition-all text-white border-none"
                >
                    <PhoneOff className="w-6 h-6" /> Cancel Vibe
                </Button>
            </motion.div>
        </div>
    );
}
