import redis, { MATCHMAKING_QUEUE, USER_SOCKET_PREFIX } from './redis.service.js';

export interface MatchResult {
    u1: string;
    u2: string;
}

export class MatchmakingService {
    async joinQueue(userId: string): Promise<MatchResult | null> {
        await redis.sadd(MATCHMAKING_QUEUE, userId);
        return this.tryMatch(userId);
    }

    async leaveQueue(userId: string): Promise<void> {
        await redis.srem(MATCHMAKING_QUEUE, userId);
    }

    async tryMatch(userId: string): Promise<MatchResult | null> {
        // Get potential peers
        const potentialPeers = await redis.smembers(MATCHMAKING_QUEUE);

        for (const peerId of potentialPeers) {
            if (peerId === userId) continue;

            const pipeline = redis.multi();
            pipeline.exists(`user_heartbeat:${peerId}`);
            pipeline.sismember(`skipped:${userId}`, peerId);
            const results = await pipeline.exec();

            const isActive = results?.[0]?.[1] as number;
            const isSkipped = results?.[1]?.[1] as number;

            if (!isActive) {
                // Cleanup inactive peer from queue
                await redis.srem(MATCHMAKING_QUEUE, peerId);
                continue;
            }

            if (isSkipped) continue;

            const removed = await redis.srem(MATCHMAKING_QUEUE, userId, peerId);
            if (removed === 2) {
                return { u1: userId, u2: peerId };
            }
        }
        return null;
    }

    async updateHeartbeat(userId: string): Promise<void> {
        await redis.set(`user_heartbeat:${userId}`, 'active', 'EX', 30); // 30 sec timeout
    }

    async skipPeer(userId: string, peerId: string): Promise<void> {
        const key = `skipped:${userId}`;
        await redis.multi()
            .sadd(key, peerId)
            .expire(key, 3600)
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
