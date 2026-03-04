import { Context } from 'hono';
import { dmService } from './dm.service.js';
import { Env } from '../../types.js';
import { matchmakingService } from '../../services/matchmaking.service.js';

// io injected at socket setup time via setIO()
let _io: any = null;
export const setIO = (io: any) => { _io = io; };

export const sendMessage = async (c: Context<Env>) => {
    const user = c.get('user');
    const { receiverId, content } = (await c.req.json()) as { receiverId: string; content: string };
    if (!receiverId || !content?.trim()) return c.json({ error: 'receiverId and content are required' }, 400);

    const result = await dmService.sendMessage(user.userId, receiverId, content);

    // 🔔 Real-time push to recipient via socket
    if (_io) {
        const recipientSocket = await matchmakingService.getUserSocket(receiverId);
        if (recipientSocket) {
            _io.to(recipientSocket).emit('dm', {
                id: result.id,
                senderId: user.userId,
                receiverId,
                content,
                createdAt: result.createdAt,
                isRead: false,
            });
        }
    }

    return c.json(result, 201);
};

export const getMessages = async (c: Context<Env>) => {
    const user = c.get('user');
    const peerId = c.req.param('userId');
    const page = Number(c.req.query('page')) || 1;
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
    const page = Number(c.req.query('page')) || 1;
    const limit = Number(c.req.query('limit')) || 20;
    const result = await dmService.getConversations(user.userId, page, limit);
    return c.json(result);
};
