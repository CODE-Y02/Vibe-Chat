import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { sendRequest, acceptRequest, rejectRequest, removeFriend, listFriends, listRequests } from '../modules/friend/friend.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { Env } from '../types.js';

const friendRoutes = new OpenAPIHono<Env>();

const friendIdSchema = z.object({
    friendId: z.string(),
});

const userIdSchema = z.object({
    userId: z.string(),
});

friendRoutes.use('*', authMiddleware);

const sendRequestRoute = createRoute({
    method: 'post',
    path: '/request',
    request: {
        body: {
            content: {
                'application/json': { schema: friendIdSchema },
            },
        },
    },
    responses: { 201: { description: 'Friend request sent' } },
});

const acceptRequestRoute = createRoute({
    method: 'post',
    path: '/accept',
    request: {
        body: {
            content: {
                'application/json': { schema: userIdSchema },
            },
        },
    },
    responses: { 200: { description: 'Friend request accepted' } },
});

const rejectRequestRoute = createRoute({
    method: 'post',
    path: '/reject',
    request: {
        body: {
            content: {
                'application/json': { schema: userIdSchema },
            },
        },
    },
    responses: { 200: { description: 'Friend request rejected' } },
});

const removeFriendRoute = createRoute({
    method: 'post',
    path: '/remove',
    request: {
        body: {
            content: {
                'application/json': { schema: friendIdSchema },
            },
        },
    },
    responses: { 200: { description: 'Friend removed' } },
});

const listFriendsRoute = createRoute({
    method: 'get',
    path: '/',
    responses: { 200: { description: 'List of friends' } },
});

const listRequestsRoute = createRoute({
    method: 'get',
    path: '/requests',
    responses: { 200: { description: 'List of friend requests' } },
});

friendRoutes.openapi(sendRequestRoute, sendRequest);
friendRoutes.openapi(acceptRequestRoute, acceptRequest);
friendRoutes.openapi(rejectRequestRoute, rejectRequest);
friendRoutes.openapi(removeFriendRoute, removeFriend);
friendRoutes.openapi(listFriendsRoute, listFriends);
friendRoutes.openapi(listRequestsRoute, listRequests);

export default friendRoutes;
