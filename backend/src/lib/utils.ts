import { Context } from 'hono';
import { Env } from '../types.js';
import crypto from 'node:crypto';

export const logger = async (c: Context<Env>, next: () => Promise<void>) => {
    const traceId = crypto.randomUUID();
    c.set('traceId', traceId);

    const start = Date.now();
    
    await next();
    
    const ms = Date.now() - start;
    console.log(JSON.stringify({
        level: 'info',
        traceId,
        method: c.req.method,
        url: c.req.url,
        status: c.res.status,
        duration: ms,
        timestamp: new Date().toISOString()
    }));
};

export class AppError extends Error {
    constructor(public statusCode: import('hono/utils/http-status').ContentfulStatusCode, message: string) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = (err: Error, c: Context<Env>) => {
    const traceId = c.get('traceId') || 'unknown';
    
    let userId = 'unknown';
    try {
        const user = c.get('user');
        if (user && user.userId) userId = user.userId;
    } catch(e) {}

    console.error(JSON.stringify({
        level: 'error',
        traceId,
        userId,
        path: c.req.url,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    }));

    if (err instanceof AppError) {
        return c.json({ error: err.message, traceId }, err.statusCode);
    }

    return c.json({ error: 'Internal Server Error', traceId }, 500);
};
