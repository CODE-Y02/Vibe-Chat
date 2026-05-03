import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger, errorHandler } from './lib/utils.js';
import webhookRoutes from './routes/webhook.routes.js';
import friendRoutes from './routes/friend.routes.js';
import feedRoutes from './routes/feed.routes.js';
import dmRoutes from './routes/dm.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import userRoutes from './routes/user.routes.js';
import systemRoutes from './routes/system.routes.js';
import dotenv from 'dotenv';
import { Env } from './types.js';

dotenv.config();

import { swaggerUI } from '@hono/swagger-ui';
import { apiReference } from '@scalar/hono-api-reference';
import { Server } from 'socket.io';
import { setupSockets } from './sockets/index.js';
import { quitRedis } from './services/redis.service.js';
import prisma from './lib/prisma.js';

// ── App ──────────────────────────────────────────────────────────────────────

const app = new OpenAPIHono<Env>();

app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
        title: 'VibeChat API',
        version: '1.0.0',
        description: 'High-Scale Real-Time Backend API',
    },
});

app.get('/docs/swagger', swaggerUI({ url: '/openapi.json' }));
// @ts-expect-error - Scalar types might be slightly misaligned with Hono Env types
app.get('/docs/scalar', apiReference({ spec: { url: '/openapi.json' } }));

// Middlewares
app.use('*', logger);
app.use('*', cors());
app.route('/webhooks', webhookRoutes);
app.route('/friends', friendRoutes);
app.route('/feed', feedRoutes);
app.route('/messages', dmRoutes);
app.route('/moderation', moderationRoutes);
app.route('/users', userRoutes);
app.route('/system', systemRoutes);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.onError(errorHandler);

// ── Server ───────────────────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3000;

const httpServer = serve(
    { fetch: app.fetch, port },
    (info) => console.log(`🚀 Server running on http://localhost:${info.port}`),
);

const io = new Server(httpServer as unknown as import('node:http').Server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket'],
    allowEIO3: true,
});

setupSockets(io);

// ── Graceful Shutdown ────────────────────────────────────────────────────────
// Order matters:
//   1. Stop accepting new HTTP connections
//   2. Close Socket.IO (drains existing connections)
//   3. Quit Redis (sends QUIT commands, waits for ACK)
//   4. Disconnect Prisma
//   5. Exit
const shutdown = async (signal: string) => {
    console.log(`[Shutdown] ${signal} received — starting graceful shutdown...`);

    // Hard timeout: force exit after 15s no matter what
    const forceExit = setTimeout(() => {
        console.error('[Shutdown] Force exit after 15s timeout');
        process.exit(1);
    }, 15000);
    forceExit.unref(); // Don't prevent natural exit if everything closes cleanly

    try {
        // 1. Stop HTTP server
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        console.log('[Shutdown] HTTP server closed');

        // 2. Close Socket.IO
        await new Promise<void>((resolve) => io.close(() => resolve()));
        console.log('[Shutdown] Socket.IO closed');

        // 3. Quit Redis connections
        await quitRedis();
        console.log('[Shutdown] Redis disconnected');

        // 4. Disconnect Prisma
        await prisma.$disconnect();
        console.log('[Shutdown] Prisma disconnected');

        clearTimeout(forceExit);
        process.exit(0);
    } catch (err) {
        console.error('[Shutdown] Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
