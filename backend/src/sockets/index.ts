import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { verifyAccessToken } from "../lib/auth.js";
import { matchmakingService } from "../services/matchmaking.service.js";
import redis, { getSubClient } from "../services/redis.service.js";
import { AuthenticatedSocket } from "./types.js";
import { registerMatchmakingHandlers } from "./matchmaking.handler.js";
import { registerSignalingHandlers } from "./signaling.handler.js";
import { registerChatHandlers } from "./chat.handler.js";
import { setIO as setDMIO } from "../modules/dm/dm.controller.js";
import { setFriendIO } from "../modules/friend/friend.controller.js";
import { setFeedIO } from "../modules/feed/feed.controller.js";
import { setUserIO } from "../modules/user/user.controller.js";

export const setupSockets = (io: Server) => {
    // Share io instance with REST controllers that push socket events
    setDMIO(io);
    setFriendIO(io);
    setFeedIO(io);
    setUserIO(io);

    // ── Redis Adapter (horizontal scaling) ────────────────────────────────────
    // We always enable the adapter when USE_REDIS=true, regardless of cluster
    // mode. In single-instance deploys it adds near-zero overhead. In multi-
    // worker PM2 deploys it is essential for cross-worker socket delivery.
    if (process.env.USE_REDIS === "true") {
        const subClient = getSubClient(); // Lazily created, singleton per process
        io.adapter(createAdapter(redis, subClient));
        console.log("[Socket.IO] ✅ Redis adapter enabled");
    } else {
        console.log("[Socket.IO] ℹ️  In-memory adapter (no Redis)");
    }

    // ── Auth middleware ───────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token as string | undefined;

        if (!token) {
            return next(new Error("Authentication error: no token"));
        }

        const payload = await verifyAccessToken(token);
        if (!payload) {
            return next(new Error("Authentication error: invalid token"));
        }

        (socket as AuthenticatedSocket).user = payload;
        next();
    });

    // ── Connection ────────────────────────────────────────────────────────────
    io.on("connection", async (s: Socket) => {
        const socket = s as AuthenticatedSocket;
        const { userId } = socket.user;
        console.log(`[Socket] Connected: ${userId} (${socket.id})`);

        // Room-per-user architecture: controllers can do io.to(userId).emit(...)
        socket.join(userId);

        // Register socket mapping and presence atomically in one pipeline
        await redis.pipeline()
            .set(`mm:socket:${userId}`, socket.id, 'EX', 3600)
            .set(`mm:heartbeat:${userId}`, '1', 'EX', 35)
            .exec();

        registerMatchmakingHandlers(io, socket);
        registerSignalingHandlers(io, socket);
        registerChatHandlers(io, socket);
    });
};
