import { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import dotenv from 'dotenv';

dotenv.config();

const USE_REDIS = process.env.USE_REDIS === 'true';

const redis = USE_REDIS
    ? new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    : new (RedisMock as any)();

redis.on('error', (err: Error) => {
    console.error('Redis error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

export const MATCHMAKING_QUEUE = 'matchmaking:queue';
export const SHADOWBAN_QUEUE = 'matchmaking:shadowban';
export const USER_SOCKET_PREFIX = 'user_socket:';
export const USER_HEARTBEAT_PREFIX = 'user_heartbeat:';
export const SESSION_PREFIX = 'session:';
export const RATE_LIMIT_PREFIX = 'rate_limit:';
export const USER_SHADOWBANNED_PREFIX = 'shadowbanned:';

export default redis;
