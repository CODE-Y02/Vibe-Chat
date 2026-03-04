"use client";

import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff, Loader2 } from "lucide-react";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { webrtc } from "@/lib/webrtc";
import { toast } from "sonner";

export function OutgoingCallModal() {
    const { outgoingCall, setOutgoingCall } = useChatStore();
    const [isPreparing, setIsPreparing] = useState(true);

    useEffect(() => {
        if (!outgoingCall) return;

        const startCall = async () => {
            setIsPreparing(true);
            try {
                // Prepare offer using the centralized webrtc instance
                const offer = await webrtc.prepareCall(outgoingCall.to);
                
                socket.emit("make-call", {
                    to: outgoingCall.to,
                    offer: offer
                });

                // Auto-cancel if no response after 30 seconds
                const timer = setTimeout(() => {
                    toast.error("No Answer", { description: "Your friend might be busy." });
                    handleCancel();
                }, 30000);

                return () => clearTimeout(timer);
            } catch (err) {
                console.error("Failed to start call", err);
                setOutgoingCall(null);
            } finally {
                setIsPreparing(false);
            }
        };

        startCall();
    }, [outgoingCall, setOutgoingCall]);

    if (!outgoingCall) return null;

    const handleCancel = () => {
        socket.emit("cancel-call", { to: outgoingCall.to });
        setOutgoingCall(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-sm rounded-[40px] p-8 text-center border-white/5 shadow-[0_0_100px_rgba(var(--primary),0.3)] flex flex-col items-center">
                <div className="relative mb-6">
                    <Avatar className="w-24 h-24 border-2 border-primary shadow-2xl">
                        <AvatarImage src={outgoingCall.toAvatar} />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-2xl">
                            {outgoingCall.toName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse opacity-20" />
                </div>

                <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{outgoingCall.toName}</h3>
                <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em] mb-8">
                    {isPreparing ? "Initializing..." : "Waiting for friend..."}
                </p>

                <div className="mb-8 h-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>

                <Button
                    onClick={handleCancel}
                    variant="destructive"
                    className="w-full h-16 rounded-2xl gap-3 font-black text-sm uppercase shadow-lg shadow-red-500/20"
                >
                    <PhoneOff className="w-5 h-5" /> Cancel Call
                </Button>
            </div>
        </div>
    );
}
