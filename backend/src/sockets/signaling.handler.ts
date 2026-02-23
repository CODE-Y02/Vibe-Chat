import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';

export const registerSignalingHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

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
