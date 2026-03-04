import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import { userService } from '../modules/user/user.service.js';

export const registerSignalingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('make-call', async ({ to }: { to: string }) => {
        console.log(`[Signaling] make-call: ${user.userId} → ${to}`);
        try {
            const caller = await userService.getById(user.userId);
            io.to(to).emit('call-made', {
                from: user.userId,
                fromName: caller.username,
                fromAvatar: caller.avatar || "",
            });
            console.log(`[Signaling] call-made emitted to room ${to}`);
        } catch (err) {
            console.error("[Signaling] Failed to get caller info:", err);
        }
    });

    socket.on('call-accepted', async ({ to }: { to: string }) => {
        console.log(`[Signaling] call-accepted: ${user.userId} accepted call from ${to}`);
        io.to(to).emit('call-accepted', { from: user.userId });
        console.log(`[Signaling] call-accepted emitted to room ${to}`);
    });

    socket.on('reject-call', async ({ to }: { to: string }) => {
        console.log(`[Signaling] reject-call: ${user.userId} rejected call from ${to}`);
        io.to(to).emit('call-rejected', { from: user.userId });
    });

    socket.on('cancel-call', async ({ to }: { to: string }) => {
        console.log(`[Signaling] cancel-call: ${user.userId} cancelled call to ${to}`);
        io.to(to).emit('call-cancelled', { from: user.userId });
    });

    socket.on('offer', async ({ to, sdp }: { to: string; sdp: unknown }) => {
        console.log(`[Signaling] WebRTC offer: ${user.userId} → ${to}`);
        io.to(to).emit('offer', { from: user.userId, sdp });
    });

    socket.on('answer', async ({ to, sdp }: { to: string; sdp: unknown }) => {
        console.log(`[Signaling] WebRTC answer: ${user.userId} → ${to}`);
        io.to(to).emit('answer', { from: user.userId, sdp });
    });

    socket.on('iceCandidate', async ({ to, candidate }: { to: string; candidate: unknown }) => {
        io.to(to).emit('iceCandidate', { from: user.userId, candidate });
    });

    socket.on('hang-up', async ({ to }: { to: string }) => {
        console.log(`[Signaling] hang-up: ${user.userId} → ${to}`);
        io.to(to).emit('hang-up', { from: user.userId });
    });
};
