import { Context } from 'hono';
import { friendService } from './friend.service.js';
import { Env } from '../../types.js';
import { AppError } from '../../lib/utils.js';

const handleError = (c: Context, err: unknown) => {
    if (err instanceof AppError) {
        return c.json({ error: err.message }, err.statusCode as any);
    }
    console.error('[FriendController] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
};

export const sendRequest = async (c: Context<Env>) => {
    try {
        const user = c.get('user');
        const { friendId } = (await c.req.json()) as { friendId: string };
        if (!friendId) return c.json({ error: 'friendId is required' }, 400);
        const result = await friendService.sendRequest(user.userId, friendId);
        return c.json(result, 201);
    } catch (err) {
        return handleError(c, err);
    }
};

export const acceptRequest = async (c: Context<Env>) => {
    try {
        const user = c.get('user');
        const { userId } = (await c.req.json()) as { userId: string };
        if (!userId) return c.json({ error: 'userId is required' }, 400);
        const result = await friendService.acceptRequest(user.userId, userId);
        return c.json(result);
    } catch (err) {
        return handleError(c, err);
    }
};

export const rejectRequest = async (c: Context<Env>) => {
    try {
        const user = c.get('user');
        const { userId } = (await c.req.json()) as { userId: string };
        if (!userId) return c.json({ error: 'userId is required' }, 400);
        const result = await friendService.rejectRequest(user.userId, userId);
        return c.json(result);
    } catch (err) {
        return handleError(c, err);
    }
};

export const removeFriend = async (c: Context<Env>) => {
    try {
        const user = c.get('user');
        const { friendId } = (await c.req.json()) as { friendId: string };
        if (!friendId) return c.json({ error: 'friendId is required' }, 400);
        const result = await friendService.removeFriend(user.userId, friendId);
        return c.json(result);
    } catch (err) {
        return handleError(c, err);
    }
};

export const listFriends = async (c: Context<Env>) => {
    try {
        const user = c.get('user');
        const result = await friendService.listFriends(user.userId);
        return c.json(result);
    } catch (err) {
        return handleError(c, err);
    }
};

export const listRequests = async (c: Context<Env>) => {
    try {
        const user = c.get('user');
        const result = await friendService.listRequests(user.userId);
        return c.json(result);
    } catch (err) {
        return handleError(c, err);
    }
};
