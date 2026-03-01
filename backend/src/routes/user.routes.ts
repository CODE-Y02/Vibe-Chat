import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getMe, getUserById, updateProfile, searchUsers } from '../modules/user/user.controller.js';
import { Env } from '../types.js';

const userRoutes = new OpenAPIHono<Env>();

// Apply auth to all user routes
userRoutes.use('*', authMiddleware);

// GET /users/me — own profile
userRoutes.openapi(
    createRoute({
        method: 'get',
        path: '/me',
        responses: { 200: { description: 'Own profile' } },
    }),
    getMe,
);

// GET /users/search?q=... — search users
userRoutes.openapi(
    createRoute({
        method: 'get',
        path: '/search',
        request: { query: z.object({ q: z.string().min(2) }) },
        responses: { 200: { description: 'Search results' } },
    }),
    searchUsers,
);

// GET /users/:id — public profile by ID
userRoutes.openapi(
    createRoute({
        method: 'get',
        path: '/:id',
        request: { params: z.object({ id: z.string() }) },
        responses: {
            200: { description: 'User profile' },
            404: { description: 'User not found' },
        },
    }),
    getUserById,
);

// PUT /users/profile — update own profile
userRoutes.openapi(
    createRoute({
        method: 'put',
        path: '/profile',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            username: z.string().min(3).max(20).optional(),
                            avatar: z.string().url().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: { description: 'Profile updated' },
            400: { description: 'Username already taken' },
        },
    }),
    updateProfile,
);

export default userRoutes;
