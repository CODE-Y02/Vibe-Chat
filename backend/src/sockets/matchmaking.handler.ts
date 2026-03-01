import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import redis from '../services/redis.service.js';

/**
 * Robust Matchmaking Handler with Detailed Tracing.
 */
export const registerMatchmakingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('heartbeat', async () => {
        await matchmakingService.updateHeartbeat(user.userId);
    });

    socket.on('joinQueue', async () => {
        console.log(`[Socket Handler] ${user.userId} requested joinQueue via ${socket.id}`);
        // Ensure the handler knows the socket is active
        await matchmakingService.setUserSocket(user.userId, socket.id);

        try {
            const match = await matchmakingService.joinQueue(user.userId);
            if (match) {
                const { u1, u2 } = match;
                const s1 = await matchmakingService.getUserSocket(u1);
                const s2 = await matchmakingService.getUserSocket(u2);

                if (s1 && s2) {
                    console.log(`[Socket Handler] SIGNALING: ${u1}(${s1}) <-> ${u2}(${s2})`);
                    io.to(s1).emit('matched', { peerId: u2 });
                    io.to(s2).emit('matched', { peerId: u1 });

                    await redis.set(`session:${u1}`, u2, 'EX', 3600);
                    await redis.set(`session:${u2}`, u1, 'EX', 3600);
                } else {
                    console.error(`[Socket Handler] SOCKET MISSING: s1:${!!s1}, s2:${!!s2}. Aborting match.`);
                    // If one socket is missing, put them back or leave them to retry
                    if (!s1) await matchmakingService.leaveQueue(u2);
                    if (!s2) await matchmakingService.leaveQueue(u1);
                }
            } else {
                console.log(`[Socket Handler] ${user.userId} is now waiting in the pool.`);
            }
        } catch (err) {
            console.error(`[Socket Handler] MATCH ERROR:`, err);
        }
    });

    socket.on('leaveQueue', async () => {
        console.log(`[Socket Handler] ${user.userId} leaving queue.`);
        await matchmakingService.leaveQueue(user.userId);
    });

    socket.on('skip', async ({ peerId }: { peerId: string }) => {
        console.log(`[Socket Handler] ${user.userId} skipping ${peerId}.`);
        await matchmakingService.skipPeer(user.userId, peerId);
        await redis.del(`session:${user.userId}`);

        // Immediate rematch attempt
        const match = await matchmakingService.joinQueue(user.userId);
        if (match) {
            const { u1, u2 } = match;
            const s1 = await matchmakingService.getUserSocket(u1);
            const s2 = await matchmakingService.getUserSocket(u2);
            if (s1 && s2) {
                console.log(`[Socket Handler] SIGNALING AFTER SKIP: ${u1} <-> ${u2}`);
                io.to(s1).emit('matched', { peerId: u2 });
                io.to(s2).emit('matched', { peerId: u1 });
                await redis.set(`session:${u1}`, u2, 'EX', 3600);
                await redis.set(`session:${u2}`, u1, 'EX', 3600);
            }
        }
    });

    socket.on('disconnect', async () => {
        console.log(`[Socket Handler] ${user.userId} disconnected.`);
        await matchmakingService.leaveQueue(user.userId);
        await matchmakingService.removeUserSocket(user.userId);

        const peerId = await redis.get(`session:${user.userId}`);
        if (peerId) {
            const peerSocket = await matchmakingService.getUserSocket(peerId);
            if (peerSocket) {
                console.log(`[Socket Handler] Informing peer ${peerId} of disconnect.`);
                io.to(peerSocket).emit('peerDisconnected');
            }
            await redis.del(`session:${user.userId}`);
            await redis.del(`session:${peerId}`);
        }
    });
};
