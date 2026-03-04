"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "@/components/layout/SessionProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { webrtc } from "@/lib/webrtc";

export function SocketManager({ children }: { children: React.ReactNode }) {
    const { data: sessionData } = useSession();
    const { setIncomingCall, setOutgoingCall, setMatched, disconnect } = useChatStore();
    const router = useRouter();
    const token = sessionData?.session?.access_token;

    useEffect(() => {
        if (!token) {
            if (socket.connected) socket.disconnect();
            return;
        }

        socket.auth = { token };
        if (!socket.connected) socket.connect();

        // 📞 CALL SIGNALING
        const handleCallMade = (data: any) => setIncomingCall(data);
        const handleCallAccepted = () => {
            setOutgoingCall(null);
            router.push("/chat");
        };
        const handleCallRejected = () => {
             toast.error("Vibe Declined", { description: "User is not active right now." });
             setOutgoingCall(null);
        };
        const handleCallCancelled = () => setIncomingCall(null);

        // 📡 WEBRTC SIGNALING (GLOBAL)
        const handleOffer = async ({ from, sdp }: { from: string, sdp: any }) => {
            console.log("[SocketManager] Receiving Offer from:", from);
            await webrtc.handleOffer(from, sdp);
        };
        const handleAnswer = async ({ sdp }: { sdp: any }) => {
            console.log("[SocketManager] Receiving Answer...");
            await webrtc.handleAnswer(sdp);
        };
        const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
            await webrtc.handleIceCandidate(candidate);
        };

        socket.on("call-made", handleCallMade);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("call-rejected", handleCallRejected);
        socket.on("call-cancelled", handleCallCancelled);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);

        return () => {
            socket.off("call-made", handleCallMade);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("call-rejected", handleCallRejected);
            socket.off("call-cancelled", handleCallCancelled);
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off("ice-candidate", handleIceCandidate);
        };
    }, [token, setIncomingCall, setOutgoingCall, router]);

    return <>{children}</>;
}
