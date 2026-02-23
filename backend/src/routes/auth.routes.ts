import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { signup, login, anonymous, refresh } from '../modules/auth/auth.controller.js';
import { Env } from '../types.js';

const authRoutes = new OpenAPIHono<Env>();

const signupRoute = createRoute({
    method: 'post',
    path: '/signup',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        username: z.string().min(3).max(20).optional(),
                        email: z.string().email().optional(),
                        password: z.string().min(6).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'User signed up' },
    },
});

const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        username: z.string().optional(),
                        email: z.string().email().optional(),
                        password: z.string().min(1),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'User logged in' },
    },
});

const anonymousRoute = createRoute({
    method: 'post',
    path: '/anonymous',
    responses: {
        201: { description: 'Anonymous session created' },
    },
});

const refreshRoute = createRoute({
    method: 'post',
    path: '/refresh',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        refreshToken: z.string(),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Token refreshed' },
    },
});

authRoutes.openapi(signupRoute, signup);
authRoutes.openapi(loginRoute, login);
authRoutes.openapi(anonymousRoute, anonymous);
authRoutes.openapi(refreshRoute, refresh);

export default authRoutes;
