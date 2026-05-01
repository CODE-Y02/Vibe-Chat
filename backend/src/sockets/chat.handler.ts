import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types.js';
import { vibeService } from '../modules/vibe/vibe.service.js';
import redis from '../services/redis.service.js';
import { matchmakingService } from '../services/matchmaking.service.js';
import { logger } from '../lib/logger.js';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const { userId } = socket.user;

    // ─── Live vibe messages (ephemeral, no DB persistence) ───────────────────
    socket.on('sendMessage', async ({ to, content }: { to: string; content: string }) => {
        // Validate that an active session exists between these two users
        const sessionPeer = await matchmakingService.getSession(userId);
        if (sessionPeer !== to) {
            logger.warn(`[Chat] ${userId} tried to message ${to} without an active session`);
            return;
        }
        io.to(to).emit('message', { from: userId, content });
    });

    // ─── Typing indicator ─────────────────────────────────────────────────────
    socket.on('typing', ({ to, isTyping }: { to: string; isTyping: boolean }) => {
        io.to(to).emit('typing', { from: userId, isTyping });
    });

    // ─── Mutual vibe save ─────────────────────────────────────────────────────
    // Uses a Redis hash as a rendezvous point. Both users must emit 'save-vibe'
    // within a 5-minute window for the transcript to be archived.
    socket.on('save-vibe', async ({ to, transcript }: { to: string; transcript: any[] }) => {
        const [u1, u2] = [userId, to].sort();
        const rendezvousKey = `vibe_save:${u1}:${u2}`;
        const myKey = `save:${userId}`;

        // Use a Lua script to atomically write + check in a single round-trip,
        // eliminating the TOCTOU race condition.
        const luaScript = `
            redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
            redis.call('EXPIRE', KEYS[1], 300)
            local u1val = redis.call('HGET', KEYS[1], ARGV[3])
            local u2val = redis.call('HGET', KEYS[1], ARGV[4])
            if u1val and u2val then
                return 1
            end
            return 0
        `;

        try {
            const bothReady = await (redis as any).eval(
                luaScript,
                1,
                rendezvousKey,
                myKey,
                JSON.stringify(transcript),
                `save:${u1}`,
                `save:${u2}`
            );

            if (bothReady === 1) {
                // Both agreed — read the data and archive
                const data = await redis.hgetall(rendezvousKey);
                const t1 = JSON.parse(data[`save:${u1}`]);
                const t2 = JSON.parse(data[`save:${u2}`]);
                const finalTranscript = t1.length >= t2.length ? t1 : t2;

                await Promise.all([
                    vibeService.archiveVibe(u1, u2, finalTranscript),
                    redis.del(rendezvousKey),
                ]);

                io.to(u1).emit('vibe-archived', { with: u2 });
                io.to(u2).emit('vibe-archived', { with: u1 });
            } else {
                // Notify peer that one side wants to save
                io.to(to).emit('peer-wants-to-remember');
            }
        } catch (err) {
            logger.error('[Chat] save-vibe error:', err);
        }
    });
};
