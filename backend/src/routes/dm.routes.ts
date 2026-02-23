import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { sendMessage, getMessages, markAsRead, getUnreadCount, getConversations } from '../modules/dm/dm.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { profanityFilter } from '../middleware/profanity.middleware.js';
import { Env } from '../types.js';

const dmRoutes = new OpenAPIHono<Env>();

dmRoutes.use('*', authMiddleware);
dmRoutes.use('*', profanityFilter);

const sendMessageRoute = createRoute({
    method: 'post',
    path: '/',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        receiverId: z.string(),
                        content: z.string().min(1).max(1000),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'Message sent successfully' },
    },
});

const getConversationsRoute = createRoute({
    method: 'get',
    path: '/conversations',
    request: {
        query: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
        }),
    },
    responses: {
        200: { description: 'Fetched list of recent active DMs' },
    },
});

const getUnreadRoute = createRoute({
    method: 'get',
    path: '/unread',
    responses: {
        200: { description: 'Fetched unread count' },
    },
});

const getMessagesRoute = createRoute({
    method: 'get',
    path: '/{userId}',
    request: {
        params: z.object({
            userId: z.string(),
        }),
    },
    responses: {
        200: { description: 'Fetched user messages' },
    },
});

const markAsReadRoute = createRoute({
    method: 'post',
    path: '/{userId}/read',
    request: {
        params: z.object({
            userId: z.string(),
        }),
    },
    responses: {
        200: { description: 'Marked conversation as read' },
    },
});

dmRoutes.openapi(sendMessageRoute, sendMessage);
dmRoutes.openapi(getConversationsRoute, getConversations);
dmRoutes.openapi(getUnreadRoute, getUnreadCount);
dmRoutes.openapi(getMessagesRoute, getMessages);
dmRoutes.openapi(markAsReadRoute, markAsRead);

export default dmRoutes;
