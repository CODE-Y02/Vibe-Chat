import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import redis, { RATE_LIMIT_PREFIX, SESSION_PREFIX } from '../services/redis.service.js';

/**
 * Robust Matchmaking Handler with Detailed Tracing.
 */
export const registerMatchmakingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    const handleMatch = async (match: { u1: string, u2: string }) => {
        const { u1, u2 } = match;
        const s1 = await matchmakingService.getUserSocket(u1);
        const s2 = await matchmakingService.getUserSocket(u2);

        if (s1 && s2) {
            console.log(`[Socket Handler] SIGNALING: ${u1} <-> ${u2}`);
            io.to(s1).emit('matched', { peerId: u2 });
            io.to(s2).emit('matched', { peerId: u1 });

            // Atomic Session Setup
            await redis.pipeline()
                .set(`${SESSION_PREFIX}${u1}`, u2, 'EX', 3600)
                .set(`${SESSION_PREFIX}${u2}`, u1, 'EX', 3600)
                .exec();
            return true;
        } else {
            console.error(`[Socket Handler] SOCKET MISSING for match: s1:${!!s1}, s2:${!!s2}. Re-queueing.`);
            if (s1) await matchmakingService.addBackToQueue(u1);
            if (s2) await matchmakingService.addBackToQueue(u2);
            return false;
        }
    };

    socket.on('heartbeat', async () => {
        await matchmakingService.updateHeartbeat(user.userId);
    });

    socket.on('joinQueue', async () => {
        console.log(`[Socket Handler] ${user.userId} requested joinQueue via ${socket.id}`);
        await matchmakingService.setUserSocket(user.userId, socket.id);

        try {
            const match = await matchmakingService.joinQueue(user.userId);
            if (match) {
                await handleMatch(match);
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
        const rateLimitKey = `${RATE_LIMIT_PREFIX}skip:${user.userId}`;
        const isRateLimited = await redis.exists(rateLimitKey);

        if (isRateLimited) {
            console.log(`[Socket Handler] Skip rate limited for ${user.userId}.`);
            socket.emit('skip-cooldown', { remaining: 5 });
            return;
        }

        console.log(`[Socket Handler] ${user.userId} skipping ${peerId}.`);
        await redis.set(rateLimitKey, '1', 'EX', 5);
        
        // 1. Mark as skipped & Notify peer
        await matchmakingService.skipPeer(user.userId, peerId);
        const peerSocket = await matchmakingService.getUserSocket(peerId);
        if (peerSocket) {
            io.to(peerSocket).emit('peerDisconnected');
        }
        
        // 2. Clear sessions
        await redis.pipeline()
            .del(`${SESSION_PREFIX}${user.userId}`)
            .del(`${SESSION_PREFIX}${peerId}`)
            .exec();

        // 3. Immediate proactive rematch
        const match = await matchmakingService.joinQueue(user.userId);
        if (match) {
            await handleMatch(match);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`[Socket Handler] ${user.userId} disconnected.`);
        await matchmakingService.leaveQueue(user.userId);
        await matchmakingService.removeUserSocket(user.userId);

        const peerId = await redis.get(`${SESSION_PREFIX}${user.userId}`);
        if (peerId) {
            const peerSocket = await matchmakingService.getUserSocket(peerId);
            if (peerSocket) {
                io.to(peerSocket).emit('peerDisconnected');
            }
            await redis.pipeline()
                .del(`${SESSION_PREFIX}${user.userId}`)
                .del(`${SESSION_PREFIX}${peerId}`)
                .exec();
        }
    });
};
