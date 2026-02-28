"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export function useSocket() {
    const { data: session } = useSession();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!session?.accessToken) return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        const socket = io(socketUrl, {
            auth: {
                token: session.accessToken
            }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, [session?.accessToken]);

    return {
        socket: socketRef.current,
        isConnected
    };
}
