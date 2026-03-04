import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import { userService } from '../modules/user/user.service.js';

export const registerSignalingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('make-call', async ({ to }: { to: string }) => {
        console.log(`[Signaling] make-call: ${user.userId} → ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        console.log(`[Signaling] Peer socket lookup for ${to}: ${peerSocket || 'NOT FOUND'}`);

        if (peerSocket) {
            try {
                const caller = await userService.getById(user.userId);
                io.to(peerSocket).emit('call-made', {
                    from: user.userId,
                    fromName: caller.username,
                    fromAvatar: caller.avatar || "",
                });
                console.log(`[Signaling] call-made emitted to socket ${peerSocket}`);
            } catch (err) {
                console.error("[Signaling] Failed to get caller info:", err);
            }
        } else {
            console.warn(`[Signaling] Cannot deliver call — user ${to} has no active socket`);
        }
    });

    socket.on('call-accepted', async ({ to }: { to: string }) => {
        console.log(`[Signaling] call-accepted: ${user.userId} accepted call from ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-accepted', { from: user.userId });
            console.log(`[Signaling] call-accepted emitted to socket ${peerSocket}`);
        } else {
            console.warn(`[Signaling] Cannot deliver call-accepted — user ${to} has no active socket`);
        }
    });

    socket.on('reject-call', async ({ to }: { to: string }) => {
        console.log(`[Signaling] reject-call: ${user.userId} rejected call from ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-rejected', { from: user.userId });
        }
    });

    socket.on('cancel-call', async ({ to }: { to: string }) => {
        console.log(`[Signaling] cancel-call: ${user.userId} cancelled call to ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-cancelled', { from: user.userId });
        }
    });

    socket.on('offer', async ({ to, sdp }: { to: string; sdp: unknown }) => {
        console.log(`[Signaling] WebRTC offer: ${user.userId} → ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('offer', { from: user.userId, sdp });
        } else {
            console.warn(`[Signaling] Cannot deliver offer — user ${to} has no active socket`);
        }
    });

    socket.on('answer', async ({ to, sdp }: { to: string; sdp: unknown }) => {
        console.log(`[Signaling] WebRTC answer: ${user.userId} → ${to}`);
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('answer', { from: user.userId, sdp });
        } else {
            console.warn(`[Signaling] Cannot deliver answer — user ${to} has no active socket`);
        }
    });

    socket.on('iceCandidate', async ({ to, candidate }: { to: string; candidate: unknown }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('iceCandidate', { from: user.userId, candidate });
        }
    });
};
