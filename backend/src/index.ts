import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger, errorHandler } from './lib/utils.js';
import authRoutes from './routes/auth.routes.js';
import friendRoutes from './routes/friend.routes.js';
import feedRoutes from './routes/feed.routes.js';
import dmRoutes from './routes/dm.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import dotenv from 'dotenv';
import { Env } from './types.js';

dotenv.config();

import { rateLimiter } from './middleware/rate-limit.middleware.js';

import { swaggerUI } from '@hono/swagger-ui';
import { apiReference } from '@scalar/hono-api-reference';

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
app.use('/auth/*', rateLimiter(10, 60)); // 10 requests per minute for auth

// Routes
app.route('/auth', authRoutes);
app.route('/friends', friendRoutes);
app.route('/feed', feedRoutes);
app.route('/messages', dmRoutes);
app.route('/moderation', moderationRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handling
app.onError(errorHandler);

import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { setupSockets } from './sockets/index.js';

const port = Number(process.env.PORT) || 3000;

const server = serve({
    fetch: app.fetch,
    port,
}, (info) => {
    console.log(`Server is running on port ${info.port}`);
});

const io = new Server(server as import('node:http').Server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

setupSockets(io);

export default app;
