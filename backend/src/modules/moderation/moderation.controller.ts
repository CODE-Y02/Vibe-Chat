import { Context } from 'hono';
import { moderationService } from './moderation.service.js';
import { Env } from '../../types.js';

export const blockUser = async (c: Context<Env>) => {
    const user = c.get('user');
    const { blockedId } = (await c.req.json()) as { blockedId: string };
    const result = await moderationService.blockUser(user.userId, blockedId);
    return c.json(result, 201);
};

export const reportUser = async (c: Context<Env>) => {
    const user = c.get('user');
    const { reportedId, reason } = (await c.req.json()) as { reportedId: string; reason: string };
    const result = await moderationService.reportUser(user.userId, reportedId, reason);
    return c.json(result, 201);
};
