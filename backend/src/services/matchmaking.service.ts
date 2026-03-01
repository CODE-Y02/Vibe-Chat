import redis, { MATCHMAKING_QUEUE, USER_SOCKET_PREFIX } from './redis.service.js';

export interface MatchResult {
    u1: string;
    u2: string;
}

/**
 * Omegle-Scale Matchmaking Service
 * Uses Lua scripting for atomic, O(1) matching.
 */
export class MatchmakingService {
    /**
     * Lua script for atomic matching.
     * 1. Tries to find a random peer in the queue that isn't skipped.
     * 2. If it finds one, removes it and returns it.
     * 3. Otherwise, adds the caller to the queue.
     */
    private readonly matchScript = `
        local queue = KEYS[1]
        local myId = ARGV[1]
        local skipsKey = "skipped:" .. myId

        -- Try SRANDMEMBER to find a match in O(1)
        -- We try a few times to account for self-matching or skipped peers
        for i=1, 10 do
            local peerId = redis.call('SRANDMEMBER', queue)
            if not peerId then break end
            
            if peerId ~= myId then
                local isSkipped = redis.call('SISMEMBER', skipsKey, peerId)
                if isSkipped == 0 then
                    -- Atomically remove to prevent double-matching
                    local removedPeer = redis.call('SREM', queue, peerId)
                    if removedPeer == 1 then
                        redis.call('SREM', queue, myId)
                        return peerId
                    end
                end
            end
        end

        -- No eligible peer found, join the queue
        redis.call('SADD', queue, myId)
        return nil
    `;

    async joinQueue(userId: string): Promise<MatchResult | null> {
        // Run atomic match script
        const matchedPeerId = await (redis as any).eval(
            this.matchScript,
            1,
            MATCHMAKING_QUEUE,
            userId
        );

        if (matchedPeerId) {
            return { u1: userId, u2: matchedPeerId };
        }
        return null;
    }

    async leaveQueue(userId: string): Promise<void> {
        await redis.srem(MATCHMAKING_QUEUE, userId);
    }

    /** 
     * Heartbeat with TTL.
     * Point #4: Zombie Cleanup.
     * If user doesn't heartbeat within 30s, they are considered gone.
     */
    async updateHeartbeat(userId: string): Promise<void> {
        // We set a flag in Redis that expires.
        // Matchmaking logic doesn't strictly need this IF we use join/leave/disconnect
        // but it's good for robust "cleanup" of stale queue entries.
        await redis.set(`user_heartbeat:${userId}`, 'active', 'EX', 30);
    }

    /** 
     * Periodically clean up zombies from the set.
     * In a massive system, this would be a background task.
     */
    async cleanupZombies(): Promise<void> {
        const members = await redis.smembers(MATCHMAKING_QUEUE);
        if (members.length === 0) return;

        const pipeline = redis.pipeline();
        for (const userId of members) {
            pipeline.exists(`user_heartbeat:${userId}`);
        }
        const results = await pipeline.exec();

        const toRemove = [];
        if (results) {
            for (let i = 0; i < members.length; i++) {
                if (!results[i][1]) toRemove.push(members[i]);
            }
        }

        if (toRemove.length > 0) {
            await redis.srem(MATCHMAKING_QUEUE, ...toRemove);
        }
    }

    async skipPeer(userId: string, peerId: string): Promise<void> {
        const key = `skipped:${userId}`;
        await redis.pipeline()
            .sadd(key, peerId)
            .expire(key, 120) // Only skip for 2 mins (X/Omegle behavior)
            .exec();
    }

    async setUserSocket(userId: string, socketId: string): Promise<void> {
        await redis.set(`${USER_SOCKET_PREFIX}${userId}`, socketId);
    }

    async getUserSocket(userId: string): Promise<string | null> {
        return redis.get(`${USER_SOCKET_PREFIX}${userId}`);
    }

    async removeUserSocket(userId: string): Promise<void> {
        await redis.del(`${USER_SOCKET_PREFIX}${userId}`);
    }
}

export const matchmakingService = new MatchmakingService();
