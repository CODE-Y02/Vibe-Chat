import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import redis from '../services/redis.service.js';

export const registerMatchmakingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('heartbeat', async () => {
        await matchmakingService.updateHeartbeat(user.userId);
    });

    socket.on('joinQueue', async () => {
        const match = await matchmakingService.joinQueue(user.userId);
        if (match) {
            const { u1, u2 } = match;
            const s1 = await matchmakingService.getUserSocket(u1);
            const s2 = await matchmakingService.getUserSocket(u2);

            if (s1 && s2) {
                io.to(s1).emit('matched', { peerId: u2 });
                io.to(s2).emit('matched', { peerId: u1 });
                // Store session in Redis
                await redis.set(`session:${u1}`, u2);
                await redis.set(`session:${u2}`, u1);
            }
        }
    });

    socket.on('leaveQueue', async () => {
        await matchmakingService.leaveQueue(user.userId);
    });

    socket.on('skip', async ({ peerId }: { peerId: string }) => {
        await matchmakingService.skipPeer(user.userId, peerId);
        // After skipping, user should probably go back to queue or try rematching
        const match = await matchmakingService.joinQueue(user.userId);
        if (match) {
            const { u1, u2 } = match;
            const s1 = await matchmakingService.getUserSocket(u1);
            const s2 = await matchmakingService.getUserSocket(u2);
            if (s1 && s2) {
                io.to(s1).emit('matched', { peerId: u2 });
                io.to(s2).emit('matched', { peerId: u1 });
                await redis.set(`session:${u1}`, u2);
                await redis.set(`session:${u2}`, u1);
            }
        }
    });

    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${user.userId}`);
        await matchmakingService.leaveQueue(user.userId);
        await matchmakingService.removeUserSocket(user.userId);

        const peerId = await redis.get(`session:${user.userId}`);
        if (peerId) {
            const peerSocket = await matchmakingService.getUserSocket(peerId);
            if (peerSocket) {
                io.to(peerSocket).emit('peerDisconnected');
            }
            await redis.del(`session:${user.userId}`);
            await redis.del(`session:${peerId}`);
        }
    });
};
