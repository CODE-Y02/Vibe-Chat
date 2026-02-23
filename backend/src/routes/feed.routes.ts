import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createPost, getFeed, reactToPost } from '../modules/feed/feed.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { profanityFilter } from '../middleware/profanity.middleware.js';
import { Env } from '../types.js';

const feedRoutes = new OpenAPIHono<Env>();


const createPostRoute = createRoute({
    method: 'post',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        content: z.string().min(1).max(500),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'Post created successfully' },
    },
});

const getFeedRoute = createRoute({
    method: 'get',
    path: '/',
    responses: {
        200: { description: 'Retrieved feed successfully' },
    },
});

const reactRoute = createRoute({
    method: 'post',
    path: '/react',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        postId: z.string(),
                        type: z.string(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Reacted strictly evaluated' },
    },
});

feedRoutes.use('*', authMiddleware);
feedRoutes.use('*', profanityFilter);

feedRoutes.openapi(createPostRoute, createPost);
feedRoutes.openapi(getFeedRoute, getFeed);
feedRoutes.openapi(reactRoute, reactToPost);

export default feedRoutes;
