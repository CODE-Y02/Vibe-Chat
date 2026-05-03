import { Hono } from 'hono';
import { Env } from '../types.js';
import redis from '../services/redis.service.js';
import prisma from '../lib/prisma.js';

const router = new Hono<Env>();

/**
 * @route   GET /system/keep-alive
 * @desc    Pings DB and Redis to prevent cold starts/pausing on free tiers.
 * @access  Private (x-system-key header required)
 */
router.get('/keep-alive', async (c) => {
    const authHeader = c.req.header('x-system-key');
    const systemKey = process.env.SYSTEM_SECRET_KEY;

    // Security check: Ensure only authorized crons can trigger this
    if (!systemKey || authHeader !== systemKey) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const start = Date.now();
        
        // 1. Wake up Supabase (PostgreSQL)
        // A direct raw query is the most lightweight way to check DB health
        await prisma.$queryRaw`SELECT 1`;
        
        // 2. Wake up Upstash (Redis)
        await redis.ping();
        
        const duration = Date.now() - start;

        return c.json({
            status: 'ok',
            message: 'VibeCheck: Systems are awake and vibing.',
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        console.error('[Keep-Alive] ❌ Failure:', err.message);
        return c.json({
            status: 'error',
            message: 'VibeCheck failed',
            error: err.message
        }, 500);
    }
});

export default router;
