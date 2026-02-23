import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { matchmakingService } from '../services/matchmaking.service.js';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('sendMessage', async ({ to, content }: { to: string, content: string }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('message', { from: user.userId, content });
        }
    });

    socket.on('typing', async ({ to, isTyping }: { to: string, isTyping: boolean }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('typing', { from: user.userId, isTyping });
        }
    });
};
