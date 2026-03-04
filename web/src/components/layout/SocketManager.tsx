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
    const { setIncomingCall, setOutgoingCall, outgoingCall, setMatched, disconnect } = useChatStore();
    const router = useRouter();

    useEffect(() => {
        if (sessionData?.session?.access_token) {
            socket.auth = { token: sessionData.session.access_token };
            if (!socket.connected) socket.connect();

            const handleCallMade = (data: any) => {
                setIncomingCall(data);
            };

            const handleCallAccepted = () => {
                console.log("[SocketManager] Call Accepted by peer");
                setOutgoingCall(null);
                router.push("/chat");
            };

            const handleCallRejected = () => {
                toast.error("Call Rejected", { description: "User declined your vibe call." });
                setOutgoingCall(null);
            };

            const handleAnswer = async ({ sdp }: { sdp: any }) => {
                // If we are currently calling someone, handle their answer
                if (outgoingCall) {
                    console.log("[SocketManager] Receiving answer for outgoing call...");
                    await webrtc.handleAnswer(sdp);
                }
            };

            const handleConnectError = (err: any) => {
                console.error("[SocketManager] Connection Error:", err.message);
            };

            socket.on("call-made", handleCallMade);
            socket.on("call-accepted", handleCallAccepted);
            socket.on("call-rejected", handleCallRejected);
            socket.on("answer", handleAnswer);
            socket.on("connect_error", handleConnectError);

            return () => {
                socket.off("call-made", handleCallMade);
                socket.off("call-accepted", handleCallAccepted);
                socket.off("call-rejected", handleCallRejected);
                socket.off("answer", handleAnswer);
                socket.off("connect_error", handleConnectError);
            };
        } else {
            if (socket.connected) socket.disconnect();
        }
    }, [sessionData?.session?.access_token, setIncomingCall, setOutgoingCall, outgoingCall, router]);

    return <>{children}</>;
}
