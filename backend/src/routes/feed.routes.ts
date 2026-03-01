import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createPost, deletePost, getFeed, reactToPost, createReply, getReplies, repost, undoRepost } from '../modules/feed/feed.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { profanityFilter } from '../middleware/profanity.middleware.js';
import { Env } from '../types.js';

/**
 * Unified Post Model Routes
 * Follows X architecture for scalability.
 */
const feedRoutes = new OpenAPIHono<Env>();
feedRoutes.use('*', authMiddleware);
feedRoutes.use('*', profanityFilter);

const postIdParam = z.object({ postId: z.string() });
const parentIdParam = z.object({ parentId: z.string() });
const contentBody = { content: { 'application/json': { schema: z.object({ content: z.string().min(1).max(500) }) } } };

// POST /feed — create top-level post
feedRoutes.openapi(
    createRoute({
        method: 'post',
        path: '/',
        request: { body: contentBody },
        responses: { 201: { description: 'Post created' } }
    }),
    createPost,
);

// DELETE /feed/:postId — delete a post
feedRoutes.openapi(
    createRoute({
        method: 'delete',
        path: '/:postId',
        request: { params: postIdParam },
        responses: { 200: { description: 'Post deleted' }, 400: { description: 'Error' } }
    }),
    deletePost,
);

// GET /feed — get feed
feedRoutes.openapi(
    createRoute({ method: 'get', path: '/', responses: { 200: { description: 'Feed' } } }),
    getFeed,
);

// POST /feed/react — like/unlike
feedRoutes.openapi(
    createRoute({
        method: 'post',
        path: '/react',
        request: { body: { content: { 'application/json': { schema: z.object({ postId: z.string(), type: z.string() }) } } } },
        responses: { 200: { description: 'Reaction toggled' } },
    }),
    reactToPost,
);

// POST /feed/:parentId/reply — reply to a post
feedRoutes.openapi(
    createRoute({
        method: 'post',
        path: '/:parentId/reply',
        request: { params: parentIdParam, body: contentBody },
        responses: { 201: { description: 'Reply created' } },
    }),
    createReply,
);

// GET /feed/:parentId/replies — get replies for a post
feedRoutes.openapi(
    createRoute({
        method: 'get',
        path: '/:parentId/replies',
        request: { params: parentIdParam },
        responses: { 200: { description: 'Replies' } },
    }),
    getReplies,
);

// POST /feed/:postId/repost — repost or quote post
feedRoutes.openapi(
    createRoute({
        method: 'post',
        path: '/:postId/repost',
        request: {
            params: postIdParam,
            body: { content: { 'application/json': { schema: z.object({ content: z.string().max(500).optional() }) } } },
        },
        responses: { 201: { description: 'Reposted' } },
    }),
    repost,
);

// DELETE /feed/:postId/repost — undo repost
feedRoutes.openapi(
    createRoute({
        method: 'delete',
        path: '/:postId/repost',
        request: { params: postIdParam },
        responses: { 200: { description: 'Repost removed' } },
    }),
    undoRepost,
);

export default feedRoutes;
