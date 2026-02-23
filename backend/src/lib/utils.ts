import { Context } from 'hono';
import { Env } from '../types.js';
import { StatusCode } from 'hono/utils/http-status';

export const logger = async (c: Context<Env>, next: () => Promise<void>) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
    await next();
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
};

export class AppError extends Error {
    constructor(public statusCode: import('hono/utils/http-status').ContentfulStatusCode, message: string) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = (err: Error, c: Context<Env>) => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        return c.json({ error: err.message }, err.statusCode);
    }

    return c.json({ error: 'Internal Server Error' }, 500);
};
