import { Context } from 'hono';
import { friendService } from './friend.service.js';
import { Env } from '../../types.js';
import { AppError } from '../../lib/utils.js';
import { matchmakingService } from '../../services/matchmaking.service.js';

let _io: any = null;
export const setFriendIO = (io: any) => { _io = io; };

export const sendRequest = async (c: Context<Env>) => {
    const user = c.get('user');
    const { friendId } = (await c.req.json()) as { friendId: string };
    if (!friendId) throw new AppError(400, 'friendId is required');

    const result = await friendService.sendRequest(user.userId, friendId);

    // 🔔 Real-time push to recipient
    if (_io) {
        const recipientSocket = await matchmakingService.getUserSocket(friendId);
        if (recipientSocket) {
            _io.to(recipientSocket).emit('friend_request', { from: user.userId });
        }
    }

    return c.json(result, 201);
};

export const acceptRequest = async (c: Context<Env>) => {
    const user = c.get('user');
    const { userId } = (await c.req.json()) as { userId: string };
    if (!userId) throw new AppError(400, 'userId is required');

    const result = await friendService.acceptRequest(user.userId, userId);

    // 🔔 Real-time push to requester
    if (_io) {
        const recipientSocket = await matchmakingService.getUserSocket(userId);
        if (recipientSocket) {
            _io.to(recipientSocket).emit('friend_accepted', { from: user.userId });
        }
    }

    return c.json(result);
};

export const rejectRequest = async (c: Context<Env>) => {
    const user = c.get('user');
    const { userId } = (await c.req.json()) as { userId: string };
    if (!userId) throw new AppError(400, 'userId is required');

    const result = await friendService.rejectRequest(user.userId, userId);
    return c.json(result);
};

export const removeFriend = async (c: Context<Env>) => {
    const user = c.get('user');
    const { friendId } = (await c.req.json()) as { friendId: string };
    if (!friendId) throw new AppError(400, 'friendId is required');

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
