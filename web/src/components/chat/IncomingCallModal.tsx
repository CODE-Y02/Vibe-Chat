"use client";

import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

export function IncomingCallModal() {
    const { incomingCall, setIncomingCall, setMatched, session } = useChatStore();
    const router = useRouter();

    if (!incomingCall || session.isMatched) return null;

    const handleAccept = () => {
        setMatched("direct-room", incomingCall.from, incomingCall.fromName, incomingCall.fromAvatar, true);
        // setIncomingCall(null) is now handled by ChatPage after it processes the offer
        router.push("/chat");
    };

    const handleDecline = () => {
        socket.emit("reject-call", { to: incomingCall.from });
        setIncomingCall(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-card w-full max-w-sm rounded-[40px] p-8 text-center border-white/5 shadow-[0_0_100px_rgba(var(--primary),0.3)] flex flex-col items-center">
                <div className="relative mb-6">
                    <Avatar className="w-24 h-24 border-2 border-primary shadow-2xl">
                        <AvatarImage src={incomingCall.fromAvatar} />
                        <AvatarFallback className="bg-primary/20 text-primary font-black text-2xl">
                            {incomingCall.fromName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
                </div>

                <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{incomingCall.fromName}</h3>
                <p className="text-white/40 text-sm font-bold uppercase tracking-[0.2em] mb-8">Incoming Vibe Call...</p>

                <div className="flex gap-4 w-full">
                    <Button
                        onClick={handleDecline}
                        variant="destructive"
                        className="flex-1 h-16 rounded-2xl gap-3 font-black text-sm uppercase shadow-lg shadow-red-500/20"
                    >
                        <PhoneOff className="w-5 h-5" /> Decline
                    </Button>
                    <Button
                        onClick={handleAccept}
                        className="flex-1 h-16 rounded-2xl gap-3 font-black text-sm uppercase bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                    >
                        <Video className="w-5 h-5" /> Accept
                    </Button>
                </div>
            </div>
        </div>
    );
}
