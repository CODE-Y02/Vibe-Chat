import { Next } from 'hono';
import { verifyAccessToken } from '../lib/auth.js';
import { AppError } from '../lib/utils.js';
import { Env } from '../types.js';
import { Context } from 'hono';

export const authMiddleware = async (c: Context<Env>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
        throw new AppError(401, 'Invalid or expired token');
    }

    c.set('user', payload);
    await next();
};
