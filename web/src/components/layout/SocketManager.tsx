"use client";

import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "@/components/layout/SessionProvider";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { webrtc } from "@/lib/webrtc";
import { useFeedStore } from "@/store/useFeedStore";

export function SocketManager({ children }: { children: React.ReactNode }) {
    const { data: sessionData } = useSession();
    const token = sessionData?.session?.access_token;
    const setHasNewPosts = useFeedStore((state) => state.setHasNewPosts);

    // ✅ FIX: useRef for router + store actions to prevent listener churn
    const routerRef = useRef(useRouter());
    const storeRef = useRef(useChatStore.getState());

    // Keep refs current without triggering re-renders
    useEffect(() => {
        return useChatStore.subscribe((state) => {
            storeRef.current = state;
        });
    }, []);

    useEffect(() => {
        if (!token) {
            if (socket.connected) socket.disconnect();
            return;
        }

        socket.auth = { token };
        if (!socket.connected) socket.connect();

        // 📞 CALL SIGNALING
        const handleCallMade = (data: any) => {
            console.log("[SocketManager] Incoming call from:", data.fromName);
            storeRef.current.setIncomingCall(data);
        };

        const handleCallAccepted = (data: any) => {
            console.log("[SocketManager] Call accepted by peer");
            storeRef.current.setOutgoingCall(null);
            routerRef.current.push("/chat");
        };

        const handleCallRejected = () => {
            console.log("[SocketManager] Call rejected");
            toast({
                variant: "destructive",
                title: "Vibe Declined",
                description: "User is not available right now."
            });
            storeRef.current.setOutgoingCall(null);
        };

        const handleCallCancelled = () => {
            console.log("[SocketManager] Call cancelled by caller");
            storeRef.current.setIncomingCall(null);
        };

        // 📡 WEBRTC SIGNALING (GLOBAL)
        const handleOffer = async ({ from, sdp }: { from: string; sdp: any }) => {
            console.log("[SocketManager] WebRTC offer from:", from);
            await webrtc.handleOffer(from, sdp);
        };

        const handleAnswer = async ({ sdp }: { sdp: any }) => {
            console.log("[SocketManager] WebRTC answer received");
            await webrtc.handleAnswer(sdp);
        };

        // ✅ FIX: Event name matches backend — `iceCandidate` not `ice-candidate`
        const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
            await webrtc.handleIceCandidate(candidate);
        };

        const handleTyping = ({ isTyping }: { isTyping: boolean }) => {
            storeRef.current.setPeerTyping(isTyping);
        };

        const handleNewPost = () => {
            console.log("[SocketManager] New post signal received");
            setHasNewPosts(true);
        };

        const handleConnectError = (err: any) => {
            console.error("[SocketManager] Connection error:", err.message);
        };

        socket.on("call-made", handleCallMade);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("call-rejected", handleCallRejected);
        socket.on("call-cancelled", handleCallCancelled);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("iceCandidate", handleIceCandidate);
        socket.on("typing", handleTyping);
        socket.on("new_post", handleNewPost);
        socket.on("connect_error", handleConnectError);

        return () => {
            socket.off("call-made", handleCallMade);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("call-rejected", handleCallRejected);
            socket.off("call-cancelled", handleCallCancelled);
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off("iceCandidate", handleIceCandidate);
            socket.off("typing", handleTyping);
            socket.off("new_post", handleNewPost);
            socket.off("connect_error", handleConnectError);
        };
    }, [token, setHasNewPosts]); // ✅ FIX: Only `token` as dependency — no router, no store actions

    return <>{children}</>;
}
