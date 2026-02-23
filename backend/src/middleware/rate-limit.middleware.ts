import { Context, Next } from 'hono';
import redis, { RATE_LIMIT_PREFIX } from '../services/redis.service.js';
import { AppError } from '../lib/utils.js';

export const rateLimiter = (limit: number, windowSeconds: number) => {
    return async (c: Context, next: Next) => {
        const ip = c.req.header('x-forwarded-for') || 'anonymous';
        const key = `${RATE_LIMIT_PREFIX}${ip}`;

        const replies = await redis.multi()
            .incr(key)
            .expire(key, windowSeconds, 'NX') // 'NX' ensures expire is only set when key has no expiry
            .exec();

        const current = replies?.[0]?.[1] as number | null;
        if (!current) {
            throw new AppError(500, 'Rate limiting error');
        }

        if (current > limit) {
            throw new AppError(429, 'Too many requests - please try again later');
        }

        await next();
    };
};
