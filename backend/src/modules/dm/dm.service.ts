import prisma from "../../lib/prisma.js";
import { Message, Prisma } from "@prisma/client";
import { matchmakingService } from "../../services/matchmaking.service.js";

export class DMService {
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    return prisma.message.create({
      data: { senderId, receiverId, content },
      include: { sender: true, receiver: true },
    });
  }

  async getMessages(
    userId: string,
    peerId: string,
    cursor?: string,
    limit = 50,
  ) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: true },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return {
      messages: messages.reverse(), // Still return in chronological order for the UI
      nextCursor,
    };
  }

  async markAsRead(
    userId: string,
    peerId: string,
  ): Promise<Prisma.BatchPayload> {
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
      by: ["senderId"],
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

    interface RawConversation {
      content: string | null;
      createdAt: Date;
      isRead: boolean;
      receiverId: string;
      senderId: string;
      peerId: string;
      peerUsername: string | null;
      peerAvatar: string | null;
    }

    // 🚀 SCALABILITY FIX: Instead of pulling all messages into memory to group them,
    // we leverage Postgres's DISTINCT ON natively WITH pagination AND JOINs!
    const conversationsRaw = await prisma.$queryRaw<RawConversation[]>`
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

    const peerIds = conversationsRaw.map((msg) => msg.peerId);
    const presence = await matchmakingService.getBulkPresence(peerIds);

    const conversations = conversationsRaw.map((msg) => ({
      peer: {
        id: msg.peerId,
        username: msg.peerUsername,
        avatar: msg.peerAvatar,
        status: presence[msg.peerId] || "offline",
      },
      lastMessage: msg.content,
      createdAt: msg.createdAt,
      isUnread: msg.receiverId === userId && !msg.isRead,
    }));

    return {
      conversations,
      total: 0, // Total is omitted to save query time, infinite scroll relies on limit length
      page,
      limit,
    };
  }
}

export const dmService = new DMService();
