import redis, { MATCHMAKING_QUEUE, SHADOWBAN_QUEUE, USER_HEARTBEAT_PREFIX, USER_SOCKET_PREFIX, USER_SHADOWBANNED_PREFIX } from './redis.service.js';
import { logger } from '../lib/logger.js';

export interface MatchResult {
    u1: string;
    u2: string;
}

export class MatchmakingService {
    /**
     * Lua script for atomic matching.
     * Logic:
     * 1. Remove my own ID from queue (to avoid self-matching if already there).
     * 2. Pick a random peer.
     * 3. If peer exists and is not skipped -> Match!
     * 4. Else -> Join queue and wait.
     */
    private readonly matchScript = `
        local queue = KEYS[1]
        local myId = ARGV[1]
        local heartbeatPrefix = ARGV[2]
        local skipsKey = "skipped:" .. myId

        -- Ensure I am not in the queue while I search
        redis.call('SREM', queue, myId)

        -- Try to find a peer (O(1) random)
        -- We try up to 10 times to dodge skipped or offline users
        for i=1, 10 do
            local peerId = redis.call('SRANDMEMBER', queue)
            if not peerId then break end
            
            if peerId ~= myId then
                -- Check heartbeat: If offline, remove from queue and continue
                local isAlive = redis.call('EXISTS', heartbeatPrefix .. peerId)
                if isAlive == 0 then
                    redis.call('SREM', queue, peerId)
                else
                    -- Check skipped
                    local isSkipped = redis.call('SISMEMBER', skipsKey, peerId)
                    if isSkipped == 0 then
                        -- Atomically claim this peer
                        local removed = redis.call('SREM', queue, peerId)
                        if removed == 1 then
                            return peerId
                        end
                    end
                end
            end
        end

        -- No luck matching? Join the queue.
        redis.call('SADD', queue, myId)
        return nil
    `;

    async isShadowbanned(userId: string): Promise<boolean> {
        return (await redis.exists(`${USER_SHADOWBANNED_PREFIX}${userId}`)) === 1;
    }

    async joinQueue(userId: string): Promise<MatchResult | null> {
        logger.info(`${userId} joining queue...`);
        const isBanned = await this.isShadowbanned(userId);
        const activeQueue = isBanned ? SHADOWBAN_QUEUE : MATCHMAKING_QUEUE;

        try {
            // ioredis returns Buffer for some results, we ensure string
            const matchedPeerId = await (redis as any).eval(
                this.matchScript,
                1,
                activeQueue,
                userId,
                USER_HEARTBEAT_PREFIX
            );

            if (matchedPeerId) {
                const peerIdString = matchedPeerId.toString();
                logger.info(`SUCCESS: ${userId} <-> ${peerIdString}`);
                return { u1: userId, u2: peerIdString };
            }

            logger.info(`WAITING: ${userId} added to pool. (Banned: ${isBanned})`);
            return null;
        } catch (err) {
            logger.error(`ERROR during Lua eval:`, err);
            // Fallback: just add to queue if Lua fails for some reason
            await redis.sadd(activeQueue, userId);
            return null;
        }
    }

    async leaveQueue(userId: string): Promise<void> {
        const isBanned = await this.isShadowbanned(userId);
        const activeQueue = isBanned ? SHADOWBAN_QUEUE : MATCHMAKING_QUEUE;
        await redis.srem(activeQueue, userId);
    }

    async updateHeartbeat(userId: string): Promise<void> {
        await redis.pipeline()
            .set(`user_heartbeat:${userId}`, 'active', 'EX', 30)
            .expire(`${USER_SOCKET_PREFIX}${userId}`, 3600) // Extend socket mapping life on every heartbeat
            .exec();
    }

    async skipPeer(userId: string, peerId: string): Promise<void> {
        const key = `skipped:${userId}`;
        await redis.pipeline()
            .sadd(key, peerId)
            .expire(key, 120)
            .exec();
    }

    async setUserSocket(userId: string, socketId: string): Promise<void> {
        // Reduced to 1 hour. Will be refreshed by heartbeats.
        await redis.set(`${USER_SOCKET_PREFIX}${userId}`, socketId, 'EX', 3600);
    }

    async getUserSocket(userId: string): Promise<string | null> {
        return redis.get(`${USER_SOCKET_PREFIX}${userId}`);
    }

    async removeUserSocket(userId: string): Promise<void> {
        await redis.del(`${USER_SOCKET_PREFIX}${userId}`);
    }
}

export const matchmakingService = new MatchmakingService();
