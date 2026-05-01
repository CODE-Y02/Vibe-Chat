import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import redis, { RATE_LIMIT_PREFIX } from '../services/redis.service.js';
import { logger } from '../lib/logger.js';

export const registerMatchmakingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const { userId } = socket.user;

    // ─── Internal: signal both sides of a confirmed match ────────────────────
    const handleMatch = async (match: { u1: string; u2: string }): Promise<boolean> => {
        const { u1, u2 } = match;
        const [s1, s2] = await Promise.all([
            matchmakingService.getUserSocket(u1),
            matchmakingService.getUserSocket(u2),
        ]);

        if (s1 && s2) {
            // Persist session and signal both users atomically
            await matchmakingService.setSession(u1, u2);
            io.to(u1).emit('matched', { peerId: u2 });
            io.to(u2).emit('matched', { peerId: u1 });
            logger.info(`[Matchmaking] MATCHED: ${u1} <-> ${u2}`);
            return true;
        }

        // One or both sides disconnected between match and signal
        logger.warn(`[Matchmaking] Socket missing for match ${u1}<->${u2} (s1=${!!s1}, s2=${!!s2}). Re-queuing live side.`);
        if (s1) {
            await matchmakingService.addBackToQueue(u1);
            io.to(u1).emit('match-failed', { reason: 'peer_disconnected' });
        }
        if (s2) {
            await matchmakingService.addBackToQueue(u2);
            io.to(u2).emit('match-failed', { reason: 'peer_disconnected' });
        }
        return false;
    };

    // ─── Heartbeat ────────────────────────────────────────────────────────────
    socket.on('heartbeat', async () => {
        await matchmakingService.updateHeartbeat(userId);
    });

    // ─── Join Queue ───────────────────────────────────────────────────────────
    socket.on('joinQueue', async () => {
        logger.info(`[Matchmaking] ${userId} requested joinQueue`);

        // Refresh socket mapping in case it changed since connection
        await matchmakingService.setUserSocket(userId, socket.id);

        // Guard: if this socket has been superseded by a newer connection for
        // the same user, abort silently.
        if (!socket.connected) return;

        try {
            const match = await matchmakingService.joinQueue(userId);
            if (match) {
                await handleMatch(match);
            } else {
                logger.info(`[Matchmaking] ${userId} waiting in pool`);
            }
        } catch (err) {
            logger.error(`[Matchmaking] joinQueue error for ${userId}:`, err);
            socket.emit('match-error', { message: 'Matchmaking failed, please retry' });
        }
    });

    // ─── Leave Queue ──────────────────────────────────────────────────────────
    socket.on('leaveQueue', async () => {
        logger.info(`[Matchmaking] ${userId} leaving queue`);
        await matchmakingService.leaveQueue(userId);
    });

    // ─── Skip ─────────────────────────────────────────────────────────────────
    socket.on('skip', async ({ peerId }: { peerId: string }) => {
        const rateLimitKey = `${RATE_LIMIT_PREFIX}skip:${userId}`;
        const isRateLimited = await redis.exists(rateLimitKey);

        if (isRateLimited) {
            socket.emit('skip-cooldown', { remaining: 5 });
            return;
        }

        logger.info(`[Matchmaking] ${userId} skipping ${peerId}`);
        await redis.set(rateLimitKey, '1', 'EX', 5);

        // Persist skip, clear session, and notify peer — all concurrently
        const [, , peerSocket] = await Promise.all([
            matchmakingService.skipPeer(userId, peerId),
            matchmakingService.clearSession(userId, peerId),
            matchmakingService.getUserSocket(peerId),
        ]);

        if (peerSocket) {
            io.to(peerSocket).emit('peerDisconnected');
        }

        // Re-queue the skipped peer server-side so they don't get stuck
        await matchmakingService.addBackToQueue(peerId);

        // Immediately try to find a new match for the skipper
        const match = await matchmakingService.joinQueue(userId);
        if (match) {
            await handleMatch(match);
        }
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        logger.info(`[Matchmaking] ${userId} disconnected (socket ${socket.id})`);

        // 1. Remove from queues + heartbeat atomically before anything else
        const [, peerId] = await Promise.all([
            redis.pipeline()
                .srem('mm:queue', userId)
                .srem('mm:shadowban_queue', userId)
                .del(`mm:heartbeat:${userId}`)
                .del(`mm:socket:${userId}`)
                .exec(),
            matchmakingService.getSession(userId),
        ]);

        if (!peerId) return;

        // 2. Clear session and notify peer
        const [, peerSocket] = await Promise.all([
            matchmakingService.clearSession(userId, peerId),
            matchmakingService.getUserSocket(peerId),
        ]);

        if (peerSocket) {
            io.to(peerSocket).emit('peerDisconnected');
        }

        // 3. Re-queue the peer so they don't get stuck
        await matchmakingService.addBackToQueue(peerId);
    });
};
