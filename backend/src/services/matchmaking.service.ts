import redis, { MATCHMAKING_QUEUE, USER_SOCKET_PREFIX } from './redis.service.js';

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
        local skipsKey = "skipped:" .. myId

        -- Ensure I am not in the queue while I search
        redis.call('SREM', queue, myId)

        -- Try to find a peer (O(1) random)
        -- We try up to 5 times to dodge skipped users without fetching the whole set
        for i=1, 5 do
            local peerId = redis.call('SRANDMEMBER', queue)
            if not peerId then break end
            
            -- Found someone that isn't me
            if peerId ~= myId then
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

        -- No luck matching? Join the queue.
        redis.call('SADD', queue, myId)
        return nil
    `;

    async joinQueue(userId: string): Promise<MatchResult | null> {
        console.log(`[MatchmakingService] ${userId} joining queue...`);
        try {
            // ioredis returns Buffer for some results, we ensure string
            const matchedPeerId = await (redis as any).eval(
                this.matchScript,
                1,
                MATCHMAKING_QUEUE,
                userId
            );

            if (matchedPeerId) {
                const peerIdString = matchedPeerId.toString();
                console.log(`[MatchmakingService] SUCCESS: ${userId} <-> ${peerIdString}`);
                return { u1: userId, u2: peerIdString };
            }

            console.log(`[MatchmakingService] WAITING: ${userId} added to pool.`);
            return null;
        } catch (err) {
            console.error(`[MatchmakingService] ERROR during Lua eval:`, err);
            // Fallback: just add to queue if Lua fails for some reason
            await redis.sadd(MATCHMAKING_QUEUE, userId);
            return null;
        }
    }

    async leaveQueue(userId: string): Promise<void> {
        await redis.srem(MATCHMAKING_QUEUE, userId);
    }

    async updateHeartbeat(userId: string): Promise<void> {
        await redis.set(`user_heartbeat:${userId}`, 'active', 'EX', 30);
    }

    async skipPeer(userId: string, peerId: string): Promise<void> {
        const key = `skipped:${userId}`;
        await redis.pipeline()
            .sadd(key, peerId)
            .expire(key, 120)
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
