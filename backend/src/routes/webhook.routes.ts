import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env } from '../types.js';
import prisma from '../lib/prisma.js';

const webhookRoutes = new OpenAPIHono<Env>();

const supabaseAuthRoute = createRoute({
    method: 'post',
    path: '/supabase-auth',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        record: z.any()
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Webhook processed' },
        401: { description: 'Unauthorized' }
    },
});

webhookRoutes.openapi(supabaseAuthRoute, async (c) => {
    const authHeader = c.req.header('x-supabase-webhook-secret');
    if (authHeader !== process.env.SUPABASE_WEBHOOK_SECRET) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = c.req.valid('json');
    const payload = body.record;

    if (!payload || !payload.id || !payload.email) {
        return c.json({ error: 'Invalid payload' }, 400);
    }

    try {
        await prisma.user.upsert({
            where: { email: payload.email },
            update: {
                supabaseAuthId: payload.id,
                avatar: payload.raw_user_meta_data?.avatar_url || undefined,
            },
            create: {
                supabaseAuthId: payload.id,
                email: payload.email,
                avatar: payload.raw_user_meta_data?.avatar_url,
            }
        });
        return c.json({ success: true }, 200);
    } catch (error) {
        console.error('Webhook error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default webhookRoutes;
