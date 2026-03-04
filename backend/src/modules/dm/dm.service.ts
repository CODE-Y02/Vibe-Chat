import prisma from '../../lib/prisma.js';
import { Message, Prisma } from '@prisma/client';

export class DMService {
    async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
        return prisma.message.create({
            data: { senderId, receiverId, content },
            include: { sender: true, receiver: true },
        });
    }

    async getMessages(userId: string, peerId: string, page = 1, limit = 50): Promise<Message[]> {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: peerId },
                    { senderId: peerId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'desc' }, // Get latest first for pagination
            skip: (page - 1) * limit,
            take: limit,
            include: { sender: true },
        });

        // Reverse to return chronological order (oldest -> newest limit)
        return messages.reverse();
    }

    async markAsRead(userId: string, peerId: string): Promise<Prisma.BatchPayload> {
        return prisma.message.updateMany({
            where: {
                senderId: peerId,
                receiverId: userId,
                isRead: false,
            },
            data: { isRead: true },
        });
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
        
        return { totalUnreadChats: counts.length };
    }

    async getConversations(userId: string, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        // 🚀 SCALABILITY FIX: Instead of pulling all messages into memory to group them, 
        // we leverage Postgres's DISTINCT ON natively WITH pagination AND JOINs!
        const conversationsRaw: any[] = await prisma.$queryRaw`
            WITH LatestMessages AS (
                SELECT DISTINCT ON (
                    CASE WHEN "senderId" < "receiverId" THEN "senderId" ELSE "receiverId" END,
                    CASE WHEN "senderId" > "receiverId" THEN "senderId" ELSE "receiverId" END
                )
                "id", "senderId", "receiverId", "content", "createdAt", "isRead"
                FROM "Message"
                WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
                ORDER BY 
                    CASE WHEN "senderId" < "receiverId" THEN "senderId" ELSE "receiverId" END,
                    CASE WHEN "senderId" > "receiverId" THEN "senderId" ELSE "receiverId" END,
                    "createdAt" DESC
            )
            SELECT 
                lm."content", lm."createdAt", lm."isRead", lm."receiverId", lm."senderId",
                u."id" as "peerId", u."username" as "peerUsername", u."avatar" as "peerAvatar"
            FROM LatestMessages lm
            JOIN "User" u ON u."id" = CASE WHEN lm."senderId" = ${userId} THEN lm."receiverId" ELSE lm."senderId" END
            ORDER BY lm."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const conversations = conversationsRaw.map(msg => ({
            peer: {
                id: msg.peerId,
                username: msg.peerUsername,
                avatar: msg.peerAvatar
            },
            lastMessage: msg.content,
            createdAt: msg.createdAt,
            isUnread: msg.receiverId === userId && !msg.isRead
        }));

        return {
            conversations,
            total: 0, // Total is omitted to save query time, infinite scroll relies on limit length
            page,
            limit
        };
    }
}

export const dmService = new DMService();
