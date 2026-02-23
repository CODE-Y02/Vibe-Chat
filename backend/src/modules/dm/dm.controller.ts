import { Context } from 'hono';
import { dmService } from './dm.service.js';
import { Env } from '../../types.js';

export const sendMessage = async (c: Context<Env>) => {
    const user = c.get('user');
    const { receiverId, content } = (await c.req.json()) as { receiverId: string; content: string };
    const result = await dmService.sendMessage(user.userId, receiverId, content);
    return c.json(result, 201);
};

export const getMessages = async (c: Context<Env>) => {
    const user = c.get('user');
    const peerId = c.req.param('userId');
    const query = c.req.query();
    const page = Number(query.page) || 1;
    const result = await dmService.getMessages(user.userId, peerId, page);
    return c.json(result);
};

export const markAsRead = async (c: Context<Env>) => {
    const user = c.get('user');
    const peerId = c.req.param('userId');
    const result = await dmService.markAsRead(user.userId, peerId);
    return c.json(result);
};

export const getUnreadCount = async (c: Context<Env>) => {
    const user = c.get('user');
    const result = await dmService.getUnreadCount(user.userId);
    return c.json(result);
};

export const getConversations = async (c: Context<Env>) => {
    const user = c.get('user');
    const query = c.req.query();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const result = await dmService.getConversations(user.userId, page, limit);
    return c.json(result);
};
