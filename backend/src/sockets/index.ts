import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '../lib/auth.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import redis from '../services/redis.service.js';
import { AuthenticatedSocket } from './types.js';
import { registerMatchmakingHandlers } from './matchmaking.handler.js';
import { registerSignalingHandlers } from './signaling.handler.js';
import { registerChatHandlers } from './chat.handler.js';
import { setIO } from '../modules/dm/dm.controller.js';

export const setupSockets = (io: Server) => {
    // Share io instance with REST controllers that need to push socket events
    setIO(io);

    // To support 100K users horizontally, we must replicate events across instances
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();

    pubClient.on('error', (err: Error) => console.error('Redis pubClient error:', err));
    subClient.on('error', (err: Error) => console.error('Redis subClient error:', err));

    io.adapter(createAdapter(pubClient, subClient));
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        console.log(`[Socket Auth Loop] Attempting connection for socket: ${socket.id}`);

        if (!token) {
            console.error(`[Socket Auth Error] No token provided for socket: ${socket.id}`);
            return next(new Error('Authentication error'));
        }

        const payload = await verifyAccessToken(token);
        if (!payload) {
            console.error(`[Socket Auth Error] Invalid/Expired token for socket: ${socket.id}`);
            return next(new Error('Invalid token'));
        }

        console.log(`[Socket Auth Success] User ${payload.userId} authenticated for socket: ${socket.id}`);
        (socket as AuthenticatedSocket).user = payload;
        next();
    });

    io.on('connection', async (s: Socket) => {
        const socket = s as AuthenticatedSocket;
        const user = socket.user;
        console.log(`User connected: ${user.userId} (${socket.id})`);

        await matchmakingService.setUserSocket(user.userId, socket.id);
        await matchmakingService.updateHeartbeat(user.userId);

        registerMatchmakingHandlers(io, socket);
        registerSignalingHandlers(io, socket);
        registerChatHandlers(io, socket);
    });
};
