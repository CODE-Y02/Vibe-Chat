import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import redis from '../services/redis.service.js';

/**
 * High-Scale Matchmaking Handler
 * Implements Omegle-style matching logic.
 */
export const registerMatchmakingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('heartbeat', async () => {
        await matchmakingService.updateHeartbeat(user.userId);
    });

    /** 
     * Point #2 (Turn-Based Retry):
     * The client calls this periodically if they are in a "Finding..." state.
     * The atomic Lua script tries to snap them a peer immediately.
     */
    socket.on('joinQueue', async () => {
        const match = await matchmakingService.joinQueue(user.userId);
        if (match) {
            const { u1, u2 } = match;
            const s1 = await matchmakingService.getUserSocket(u1);
            const s2 = await matchmakingService.getUserSocket(u2);

            // Notify both sockets - atomicity is guaranteed by Redis Lua
            if (s1) io.to(s1).emit('matched', { peerId: u2 });
            if (s2) io.to(s2).emit('matched', { peerId: u1 });

            // Store active session for disconnect protection
            await redis.set(`session:${u1}`, u2, 'EX', 3600); // 1hr max session
            await redis.set(`session:${u2}`, u1, 'EX', 3600);
        }
    });

    socket.on('leaveQueue', async () => {
        await matchmakingService.leaveQueue(user.userId);
    });

    /** Skip: Instantly match with someone else */
    socket.on('skip', async ({ peerId }: { peerId: string }) => {
        await matchmakingService.skipPeer(user.userId, peerId);

        // Clear old session
        await redis.del(`session:${user.userId}`);

        // Point #1 & #2: Instantly try to match again with O(1) Lua
        const match = await matchmakingService.joinQueue(user.userId);
        if (match) {
            const { u1, u2 } = match;
            const s1 = await matchmakingService.getUserSocket(u1);
            const s2 = await matchmakingService.getUserSocket(u2);
            if (s1) io.to(s1).emit('matched', { peerId: u2 });
            if (s2) io.to(s2).emit('matched', { peerId: u1 });
            await redis.set(`session:${u1}`, u2, 'EX', 3600);
            await redis.set(`session:${u2}`, u1, 'EX', 3600);
        }
    });

    /** Point #4 (Zombie Cleanup): Ensure disconnect drops from the pool */
    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${user.userId}`);
        await matchmakingService.leaveQueue(user.userId);
        await matchmakingService.removeUserSocket(user.userId);

        const peerId = await redis.get(`session:${user.userId}`);
        if (peerId) {
            const peerSocket = await matchmakingService.getUserSocket(peerId);
            if (peerSocket) {
                // Inform the partner so they can auto-rematch (Point #2 behavior)
                io.to(peerSocket).emit('peerDisconnected');
            }
            await redis.del(`session:${user.userId}`);
            await redis.del(`session:${peerId}`);
        }
    });
};
