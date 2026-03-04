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
import dotenv from 'dotenv';
import { Env } from './types.js';

dotenv.config();

import { rateLimiter } from './middleware/rate-limit.middleware.js';
import { swaggerUI } from '@hono/swagger-ui';
import { apiReference } from '@scalar/hono-api-reference';
import { Server } from 'socket.io';
import { setupSockets } from './sockets/index.js';

// ── App ──────────────────────────────────────────────────────────────────────

const app = new OpenAPIHono<Env>();

// OpenAPI documentation setup
app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
        title: 'Project 2 API',
        version: '1.0.0',
        description: 'High-Scale Backend API',
    },
});

// Mount UIs
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

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handling
app.onError(errorHandler);

// ── Server ───────────────────────────────────────────────────────────────────
// We use @hono/node-server's `serve()` which returns a plain node:http.Server.
// Socket.IO attaches to that same server instance.
// IMPORTANT: No `export default app` — Bun auto-calls Bun.serve() on any
// default export that has a `fetch` handler, which would cause EADDRINUSE.

const port = Number(process.env.PORT) || 3000;

const httpServer = serve(
    { fetch: app.fetch, port },
    (info) => console.log(`🚀 Server running on http://localhost:${info.port}`),
);

// Attach Socket.IO to the same underlying http.Server
const io = new Server(httpServer as unknown as import('node:http').Server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    // Force WebSocket-only — prevents long-polling from consuming browser connection slots
    transports: ['websocket'],
    allowEIO3: true,
});

setupSockets(io);

// ── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = () => {
    console.log(JSON.stringify({ level: 'info', message: 'SIGTERM received. Starting graceful shutdown...' }));
    
    // Close HTTP Server (Stops accepting new connections)
    httpServer.close(() => {
        console.log(JSON.stringify({ level: 'info', message: 'HTTP server closed.' }));
        process.exit(0);
    });
    
    // Force close after 10s
    setTimeout(() => {
        console.error(JSON.stringify({ level: 'error', message: 'Force closing after 10s timeout.' }));
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
