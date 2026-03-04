"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "@/components/layout/SessionProvider";
import { toast } from "sonner";

export function SocketManager({ children }: { children: React.ReactNode }) {
    const { data: sessionData } = useSession();
    const { setIncomingCall } = useChatStore();

    useEffect(() => {
        if (sessionData?.session?.access_token) {
            console.log("[SocketManager] Authenticated. Connecting global socket...");
            
            // Set auth token
            socket.auth = { token: sessionData.session.access_token };
            
            if (!socket.connected) {
                socket.connect();
            }

            const handleCallMade = (data: any) => {
                console.log("[SocketManager] Incoming Call Detected:", data.fromName);
                setIncomingCall(data);
            };

            const handleConnectError = (err: any) => {
                console.error("[SocketManager] Connection Error:", err.message);
                // If token is expired, we might want to handle it, but SessionProvider usually does
            };

            socket.on("call-made", handleCallMade);
            socket.on("connect_error", handleConnectError);

            return () => {
                socket.off("call-made", handleCallMade);
                socket.off("connect_error", handleConnectError);
            };
        } else {
            // If logged out, disconnect
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }, [sessionData?.session?.access_token, setIncomingCall]);

    return <>{children}</>;
}
