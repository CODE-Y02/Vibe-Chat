import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { vibeService } from '../modules/vibe/vibe.service.js';
import redis from '../services/redis.service.js';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.user;

    socket.on('sendMessage', async ({ to, content }: { to: string, content: string }) => {
        io.to(to).emit('message', { from: user.userId, content });
    });

    socket.on('typing', async ({ to, isTyping }: { to: string, isTyping: boolean }) => {
        io.to(to).emit('typing', { from: user.userId, isTyping });
    });

    socket.on('save-vibe', async ({ to, transcript }: { to: string, transcript: any[] }) => {
        const [u1, u2] = [user.userId, to].sort();
        const key = `vibe_save:${u1}:${u2}`;
        const userKey = `save:${user.userId}`;

        // Store this user's transcript and intention
        await redis.hset(key, userKey, JSON.stringify(transcript));
        await redis.expire(key, 300); // 5 minute window

        const data = await redis.hgetall(key);
        const hasU1 = data[`save:${u1}`];
        const hasU2 = data[`save:${u2}`];

        if (hasU1 && hasU2) {
            try {
                // Both agreed! Use the longer transcript just in case
                const t1 = JSON.parse(hasU1);
                const t2 = JSON.parse(hasU2);
                const finalTranscript = t1.length >= t2.length ? t1 : t2;

                await vibeService.archiveVibe(u1, u2, finalTranscript);
                
                io.to(u1).emit('vibe-archived', { with: u2 });
                io.to(u2).emit('vibe-archived', { with: u1 });
                
                await redis.del(key);
            } catch (err) {
                console.error("[ChatHandler] Vibe archive failed:", err);
            }
        } else {
            // Notify peer that someone wants to remember them
            io.to(to).emit('peer-wants-to-remember');
        }
    });
};
