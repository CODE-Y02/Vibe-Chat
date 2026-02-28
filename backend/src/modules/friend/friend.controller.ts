import { Context } from 'hono';
import { friendService } from './friend.service.js';
import { Env } from '../../types.js';

export const sendRequest = async (c: Context<Env>) => {
    const user = c.get('user');
    const { friendId } = (await c.req.json()) as { friendId: string };
    const result = await friendService.sendRequest(user.userId, friendId);
    return c.json(result, 201);
};

export const acceptRequest = async (c: Context<Env>) => {
    const user = c.get('user');
    const { userId } = (await c.req.json()) as { userId: string };
    const result = await friendService.acceptRequest(user.userId, userId);
    return c.json(result);
};

export const rejectRequest = async (c: Context<Env>) => {
    const user = c.get('user');
    const { userId } = (await c.req.json()) as { userId: string };
    const result = await friendService.rejectRequest(user.userId, userId);
    return c.json(result);
};

export const removeFriend = async (c: Context<Env>) => {
    const user = c.get('user');
    const { friendId } = (await c.req.json()) as { friendId: string };
    const result = await friendService.removeFriend(user.userId, friendId);
    return c.json(result);
};

export const listFriends = async (c: Context<Env>) => {
    const user = c.get('user');
    const result = await friendService.listFriends(user.userId);
    return c.json(result);
};

export const listRequests = async (c: Context<Env>) => {
    const user = c.get('user');
    const result = await friendService.listRequests(user.userId);
    return c.json(result);
};
