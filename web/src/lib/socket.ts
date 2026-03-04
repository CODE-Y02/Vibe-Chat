"use client";

import { io, Socket } from "socket.io-client";
import { useSocketStore } from "../store/useSocketStore";

const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// This is a singleton instance for global socket events (like anonymous chat)
// For authenticated DMs, we might use a separate hook or this one if token is provided
export const socket: Socket = io(socketUrl, {
    autoConnect: false,
    // 🔑 CRITICAL: Force WebSocket only.
    // Default ['polling','websocket'] starts with HTTP long-polling which
    // consumes all 6 browser connections per domain — blocking every REST call.
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
});


socket.on("connect", () => {
    useSocketStore.getState().setStatus("connected");
    console.log("Global socket connected");
});

socket.on("disconnect", () => {
    useSocketStore.getState().setStatus("disconnected");
    console.log("Global socket disconnected");
});

socket.on("connect_error", (error) => {
    useSocketStore.getState().setStatus("error");
    console.error("Socket error [Auth Check]:", error.message, "| Has Token:", !!(socket.auth as any)?.token);
});
