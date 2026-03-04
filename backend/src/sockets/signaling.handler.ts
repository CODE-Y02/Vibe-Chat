import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import { userService } from '../modules/user/user.service.js';

export const registerSignalingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('make-call', async ({ to, offer }: { to: string, offer: unknown }) => {
        console.log(`[Signaling] call-request from ${user.userId} to ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            try {
                const caller = await userService.getById(user.userId);
                io.to(peerSocket).emit('call-made', {
                    from: user.userId,
                    fromName: caller.username,
                    fromAvatar: caller.avatar || "",
                    offer
                });
            } catch (err) {
                console.error("[Signaling] Failed to get caller info", err);
            }
        }
    });

    socket.on('call-accepted', async ({ to }: { to: string }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-accepted', { from: user.userId });
        }
    });

    socket.on('reject-call', async ({ to }: { to: string }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-rejected', { from: user.userId });
        }
    });

    socket.on('cancel-call', async ({ to }: { to: string }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-cancelled', { from: user.userId });
        }
    });

    socket.on('offer', async ({ to, sdp }: { to: string, sdp: unknown }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('offer', { from: user.userId, sdp });
        }
    });

    socket.on('answer', async ({ to, sdp }: { to: string, sdp: unknown }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('answer', { from: user.userId, sdp });
        }
    });

    socket.on('iceCandidate', async ({ to, candidate }: { to: string, candidate: unknown }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('iceCandidate', { from: user.userId, candidate });
        }
    });
};
