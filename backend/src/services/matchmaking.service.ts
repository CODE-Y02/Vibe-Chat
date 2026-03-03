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
        local mySkipsKey = "skipped:" .. myId

        -- 1. Remove myself from queue to search
        redis.call('SREM', queue, myId)

        -- 2. Try to find a valid match (up to 5 attempts to skip ghosts)
        local retries = 5
        while retries > 0 do
            local peerId = redis.call('SRANDMEMBER', queue)
            if not peerId then break end -- Queue is empty

            if peerId ~= myId then
                -- Verify peer is online
                local isAlive = redis.call('EXISTS', heartbeatPrefix .. peerId)
                
                if isAlive == 1 then
                    -- Verify skip (bidirectional check)
                    local peerSkipsKey = "skipped:" .. peerId
                    local iSkippedPeer = redis.call('SISMEMBER', mySkipsKey, peerId)
                    local peerSkippedMe = redis.call('SISMEMBER', peerSkipsKey, myId)

                    if iSkippedPeer == 0 and peerSkippedMe == 0 then
                        -- Atomically claim this peer
                        local removed = redis.call('SREM', queue, peerId)
                        if removed == 1 then
                            return peerId
                        end
                    end
                else
                    -- Peer is actually offline, clean up the ghost and retry
                    redis.call('SREM', queue, peerId)
                end
            end
            retries = retries - 1
        end

        -- 3. No match found? Join the pool.
        redis.call('SADD', queue, myId)
        return nil
    `;

    async isShadowbanned(userId: string): Promise<boolean> {
        return (await redis.exists(`${USER_SHADOWBANNED_PREFIX}${userId}`)) === 1;
    }

    async addBackToQueue(userId: string): Promise<void> {
        const isBanned = await this.isShadowbanned(userId);
        const activeQueue = isBanned ? SHADOWBAN_QUEUE : MATCHMAKING_QUEUE;
        await redis.sadd(activeQueue, userId);
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
        const u1Key = `skipped:${userId}`;
        const u2Key = `skipped:${peerId}`;
        const skipTTL = 60; // 60 seconds skip cooldown

        await redis.pipeline()
            .sadd(u1Key, peerId)
            .expire(u1Key, skipTTL)
            .sadd(u2Key, userId)
            .expire(u2Key, skipTTL)
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
