import prisma from '../../lib/prisma.js';
import redis from '../../services/redis.service.js';
import { Message, Prisma } from '@prisma/client';

export class DMService {
    async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
        const message = await prisma.message.create({
            data: { senderId, receiverId, content },
            include: { sender: true, receiver: true },
        });

        // Invalidate cache for new messaging on both ends
        await redis.del(`conversations:${senderId}`);
        await redis.del(`conversations:${receiverId}`);

        return message;
    }

    async getMessages(userId: string, peerId: string, page = 1, limit = 50): Promise<Message[]> {
        return prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: peerId },
                    { senderId: peerId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },   // oldest first → top-to-bottom like WA
            skip: (page - 1) * limit,
            take: limit,
            include: { sender: true },
        });
    }

    async markAsRead(userId: string, peerId: string): Promise<Prisma.BatchPayload> {
        const result = await prisma.message.updateMany({
            where: {
                senderId: peerId,
                receiverId: userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        // Invalidate cache reflecting unread counts correctly on Inbox Screen
        await redis.del(`conversations:${userId}`);

        return result;
    }

    async getUnreadCount(userId: string) {
        const counts = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: userId,
                isRead: false,
            },
            _count: {
                senderId: true,
            },
        });
        return counts;
    }

    async getConversations(userId: string, page = 1, limit = 20) {
        const cacheKey = `conversations:${userId}`;
        const cached = await redis.get(cacheKey);
        let allConversations: { peer: { id: string; username: string | null; avatar: string | null; }; lastMessage: string; createdAt: Date; isUnread: boolean; }[];

        if (cached) {
            allConversations = JSON.parse(cached);
        } else {
            const messages = await prisma.message.findMany({
                where: {
                    OR: [{ senderId: userId }, { receiverId: userId }],
                },
                orderBy: { createdAt: 'desc' },
                include: { sender: { select: { id: true, username: true, avatar: true } }, receiver: { select: { id: true, username: true, avatar: true } } }
            });

            const conversations = new Map();
            for (const msg of messages) {
                const peerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
                const peer = msg.senderId === userId ? msg.receiver : msg.sender;

                if (!conversations.has(peerId)) {
                    conversations.set(peerId, {
                        peer,
                        lastMessage: msg.content,
                        createdAt: msg.createdAt,

                        // Unread flags
                        isUnread: msg.receiverId === userId && !msg.isRead
                    });
                }
            }

            allConversations = Array.from(conversations.values());
            await redis.set(cacheKey, JSON.stringify(allConversations), 'EX', 3600); // Cache whole mapping for 1 hr
        }

        // Return slice mapped limit for lazy loading
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            conversations: allConversations.slice(start, end),
            total: allConversations.length,
            page,
            limit
        };
    }
}

export const dmService = new DMService();
