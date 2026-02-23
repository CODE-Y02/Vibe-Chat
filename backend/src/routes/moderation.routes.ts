import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { blockUser, reportUser } from '../modules/moderation/moderation.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { Env } from '../types.js';

const moderationRoutes = new OpenAPIHono<Env>();

moderationRoutes.use('*', authMiddleware);

const blockRoute = createRoute({
    method: 'post',
    path: '/block',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        blockedId: z.string(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'User blocked' },
    },
});

const reportRoute = createRoute({
    method: 'post',
    path: '/report',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        reportedId: z.string(),
                        reason: z.string(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'User reported' },
    },
});

moderationRoutes.openapi(blockRoute, blockUser);
moderationRoutes.openapi(reportRoute, reportUser);

export default moderationRoutes;
