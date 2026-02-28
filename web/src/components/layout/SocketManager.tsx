"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useChatStore } from "@/store/useChatStore";
import { useSession } from "next-auth/react";

export function SocketManager({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const { setIncomingCall } = useChatStore();

    useEffect(() => {
        if (session?.accessToken) {
            // Connect global socket with token if needed, or rely on internal hooks
            // But for anonymous/global events, we often use the singleton 'socket'

            socket.on("call-made", (data) => {
                setIncomingCall(data);
            });

            return () => {
                socket.off("call-made");
            };
        }
    }, [session, setIncomingCall]);

    return <>{children}</>;
}
