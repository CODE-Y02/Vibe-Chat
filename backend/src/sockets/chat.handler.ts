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

    socket.on('call-user', async ({ to, signalData, fromName, fromAvatar }: { to: string, signalData: any, fromName: string, fromAvatar: string }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-made', {
                offer: signalData,
                from: user.userId,
                fromName,
                fromAvatar
            });
        }
    });

    socket.on('make-answer', async ({ to, answer }: { to: string, answer: any }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('answer-made', {
                answer,
                from: user.userId
            });
        }
    });

    socket.on('reject-call', async ({ to }: { to: string }) => {
        const peerSocket = await matchmakingService.getUserSocket(to);
        if (peerSocket) {
            io.to(peerSocket).emit('call-rejected', { from: user.userId });
        }
    });
};
