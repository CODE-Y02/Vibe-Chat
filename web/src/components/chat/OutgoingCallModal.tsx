"use client";

import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, Loader2, Sparkles, Video, Volume2, ShieldCheck, Zap } from "lucide-react";
import { socket } from "@/lib/socket";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function OutgoingCallModal() {
    const { outgoingCall, setOutgoingCall } = useChatStore();
    const [audioAllowed, setAudioAllowed] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!outgoingCall) return;

        // Play outgoing ring sound (standard outgoing beep SFX)
        const ring = new Audio("https://cdn.pixabay.com/audio/2022/10/30/audio_b29267a57a.mp3");
        ring.loop = true;
        ring.volume = 0.4;
        audioRef.current = ring;

        const playPromise = ring.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                console.log("[Call] Autoplay blocked - awaiting user interaction");
                setAudioAllowed(false);
            });
        }

        console.log("[OutgoingCall] Requesting call to:", outgoingCall.to);
        socket.emit("make-call", {
            to: outgoingCall.to
        });

        const timer = setTimeout(() => {
            toast.error("Vibe Buddy Busy", { description: "Your friend didn't pick up." });
            handleCancel();
        }, 45000); 

        return () => {
            clearTimeout(timer);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [outgoingCall]);

    if (!outgoingCall) return null;

    const handleCancel = () => {
        if (audioRef.current) audioRef.current.pause();
        socket.emit("cancel-call", { to: outgoingCall.to });
        setOutgoingCall(null);
    };

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
                    <div className="absolute -bottom-2 -left-2 bg-primary p-3.5 rounded-2.5xl shadow-[0_10px_30px_rgba(243,75,59,0.5)]">
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

                <div className="flex flex-col gap-4 w-full">
                    <Button
                        onClick={handleCancel}
                        variant="destructive"
                        className="w-full h-20 rounded-[2.5rem] gap-4 font-black text-lg uppercase bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 hover:scale-[1.03] active:scale-95 transition-all text-white border-none"
                    >
                        <PhoneOff className="w-6 h-6" /> Cancel Vibe
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
