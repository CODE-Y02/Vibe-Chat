"use client";

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { useSession } from 'next-auth/react';

/**
 * High-Scale Socket Hook (Singleton Wrapper)
 * Ensures that 'one user = one connection' across the entire app.
 */
export function useSocket() {
    const { data: session } = useSession();
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        if (!session?.accessToken) return;

        // 🟢 Sync the shared singleton auth token
        socket.auth = { token: session.accessToken };

        const onConnect = () => {
            console.log('[useSocket] Shared socket connected');
            setIsConnected(true);
        };
        const onDisconnect = () => {
            console.log('[useSocket] Shared socket disconnected');
            setIsConnected(false);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // 🟢 Heartbeat logic: Keep connection alive in Redis (Global)
        const heartbeatInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat');
            }
        }, 15000);

        // 🟢 Robust Connection Logic
        if (!socket.connected) {
            console.log('[useSocket] Connecting singleton socket...');
            socket.connect();
        } else {
            setIsConnected(true);
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            clearInterval(heartbeatInterval);
        };
    }, [session?.accessToken]);

    return {
        socket,
        isConnected
    };
}
