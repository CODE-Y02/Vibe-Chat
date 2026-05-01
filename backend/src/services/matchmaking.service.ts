import redis, {
    MATCHMAKING_QUEUE,
    SHADOWBAN_QUEUE,
    USER_HEARTBEAT_PREFIX,
    USER_SOCKET_PREFIX,
    USER_SHADOWBANNED_PREFIX,
    SESSION_PREFIX,
} from './redis.service.js';
import { logger } from '../lib/logger.js';

export interface MatchResult {
    u1: string;
    u2: string;
}

export class MatchmakingService {
    /**
     * Atomic Lua matchmaking script.
     *
     * Flow:
     *  1. Remove myself from queue (prevent self-match).
     *  2. Try up to 8 random peers.
     *  3. Skip if heartbeat expired (ghost) — remove ghost from queue.
     *  4. Skip if bidirectional skip history exists.
     *  5. Atomically claim peer with SREM (prevents double-claiming in concurrent workers).
     *  6. If no peer found → re-add myself to queue and return nil.
     */
    private readonly matchScript = `
        local queue          = KEYS[1]
        local myId           = ARGV[1]
        local heartbeatPfx   = ARGV[2]
        local skipPfx        = ARGV[3]
        local mySkipsKey     = skipPfx .. myId

        redis.call('SREM', queue, myId)

        local attempts = 8
        while attempts > 0 do
            local peerId = redis.call('SRANDMEMBER', queue)
            if not peerId then break end

            if peerId ~= myId then
                local isAlive = redis.call('EXISTS', heartbeatPfx .. peerId)

                if isAlive == 1 then
                    local peerSkipsKey   = skipPfx .. peerId
                    local iSkippedPeer   = redis.call('SISMEMBER', mySkipsKey, peerId)
                    local peerSkippedMe  = redis.call('SISMEMBER', peerSkipsKey, myId)

                    if iSkippedPeer == 0 and peerSkippedMe == 0 then
                        if redis.call('SREM', queue, peerId) == 1 then
                            return peerId
                        end
                    end
                else
                    redis.call('SREM', queue, peerId)
                end
            end

            attempts = attempts - 1
        end

        redis.call('SADD', queue, myId)
        return nil
    `;

    // ─── Shadowban ───────────────────────────────────────────────────────────

    async isShadowbanned(userId: string): Promise<boolean> {
        return (await redis.exists(`${USER_SHADOWBANNED_PREFIX}${userId}`)) === 1;
    }

    // ─── Queue management ────────────────────────────────────────────────────

    async addBackToQueue(userId: string): Promise<void> {
        const isBanned = await this.isShadowbanned(userId);
        const activeQueue = isBanned ? SHADOWBAN_QUEUE : MATCHMAKING_QUEUE;
        await redis.sadd(activeQueue, userId);
    }

    async leaveQueue(userId: string): Promise<void> {
        // Atomic removal from BOTH queues — no need to check which one the user is in.
        // Prevents a race condition where userId switches queues between check and remove.
        await redis.pipeline()
            .srem(MATCHMAKING_QUEUE, userId)
            .srem(SHADOWBAN_QUEUE, userId)
            .exec();
    }

    async joinQueue(userId: string): Promise<MatchResult | null> {
        logger.info(`${userId} joining queue...`);
        const isBanned = await this.isShadowbanned(userId);
        const activeQueue = isBanned ? SHADOWBAN_QUEUE : MATCHMAKING_QUEUE;

        try {
            const matchedPeerId = await (redis as any).eval(
                this.matchScript,
                1,
                activeQueue,
                userId,
                USER_HEARTBEAT_PREFIX,
                "mm:skip:"
            );

            if (matchedPeerId) {
                const peerId = matchedPeerId.toString();
                logger.info(`MATCHED: ${userId} <-> ${peerId}`);
                return { u1: userId, u2: peerId };
            }

            logger.info(`WAITING: ${userId} added to pool (shadowbanned=${isBanned})`);
            return null;
        } catch (err) {
            logger.error(`Lua eval error for ${userId}:`, err);
            // Best-effort fallback: ensure user is in the queue
            await redis.sadd(activeQueue, userId).catch(() => {});
            return null;
        }
    }

    // ─── Presence / Heartbeat ────────────────────────────────────────────────

    /**
     * Called on every heartbeat event from the client (every ~20s).
     * Sets a 35s TTL — slightly longer than the client interval to absorb
     * a single missed heartbeat without false offline flips.
     */
    async updateHeartbeat(userId: string): Promise<void> {
        await redis.pipeline()
            .set(`${USER_HEARTBEAT_PREFIX}${userId}`, '1', 'EX', 35)
            .expire(`${USER_SOCKET_PREFIX}${userId}`, 3600)
            .exec();
    }

    async deleteHeartbeat(userId: string): Promise<void> {
        await redis.del(`${USER_HEARTBEAT_PREFIX}${userId}`);
    }

    async getPresence(userId: string): Promise<'online' | 'offline'> {
        const alive = await redis.exists(`${USER_HEARTBEAT_PREFIX}${userId}`);
        return alive ? 'online' : 'offline';
    }

    async getBulkPresence(userIds: string[]): Promise<Record<string, 'online' | 'offline'>> {
        if (!userIds.length) return {};

        const pipeline = redis.pipeline();
        for (const id of userIds) {
            pipeline.exists(`${USER_HEARTBEAT_PREFIX}${id}`);
        }

        const results = await pipeline.exec();
        const presence: Record<string, 'online' | 'offline'> = {};

        userIds.forEach((id, i) => {
            const [err, exists] = results![i];
            if (err) {
                logger.error(`getBulkPresence: pipeline error for ${id}:`, err);
                presence[id] = 'offline';
            } else {
                presence[id] = exists ? 'online' : 'offline';
            }
        });

        return presence;
    }

    // ─── Skip history ────────────────────────────────────────────────────────

    async skipPeer(userId: string, peerId: string): Promise<void> {
        const u1Key = `mm:skip:${userId}`;
        const u2Key = `mm:skip:${peerId}`;
        const SKIP_TTL = 60; // 60 second mutual cooldown

        await redis.pipeline()
            .sadd(u1Key, peerId)
            .expire(u1Key, SKIP_TTL)
            .sadd(u2Key, userId)
            .expire(u2Key, SKIP_TTL)
            .exec();
    }

    // ─── Socket mapping ──────────────────────────────────────────────────────

    async setUserSocket(userId: string, socketId: string): Promise<void> {
        await redis.set(`${USER_SOCKET_PREFIX}${userId}`, socketId, 'EX', 3600);
    }

    async getUserSocket(userId: string): Promise<string | null> {
        return redis.get(`${USER_SOCKET_PREFIX}${userId}`);
    }

    async removeUserSocket(userId: string): Promise<void> {
        await redis.del(`${USER_SOCKET_PREFIX}${userId}`);
    }

    // ─── Session (active vibe match) ─────────────────────────────────────────

    async setSession(u1: string, u2: string): Promise<void> {
        await redis.pipeline()
            .set(`${SESSION_PREFIX}${u1}`, u2, 'EX', 3600)
            .set(`${SESSION_PREFIX}${u2}`, u1, 'EX', 3600)
            .exec();
    }

    async getSession(userId: string): Promise<string | null> {
        return redis.get(`${SESSION_PREFIX}${userId}`);
    }

    async clearSession(u1: string, u2: string): Promise<void> {
        await redis.pipeline()
            .del(`${SESSION_PREFIX}${u1}`)
            .del(`${SESSION_PREFIX}${u2}`)
            .exec();
    }
}

export const matchmakingService = new MatchmakingService();
