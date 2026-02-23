import prisma from '../../lib/prisma.js';
import { Post, Reaction } from '@prisma/client';

export class FeedService {
    async createPost(authorId: string, content: string): Promise<Post> {
        return prisma.post.create({
            data: { authorId, content },
            include: { author: true },
        });
    }

    async getFeed(userId: string, page = 1, limit = 10): Promise<Post[]> {
        const friends = await prisma.friend.findMany({
            where: {
                OR: [
                    { userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' },
                ],
            },
        });

        const friendIds = friends.map(f => (f.userId === userId ? f.friendId : f.userId));

        return prisma.post.findMany({
            where: {
                authorId: { in: [userId, ...friendIds] },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                author: true,
                reactions: true,
            },
        });
    }

    async reactToPost(userId: string, postId: string, type: string): Promise<Reaction> {
        return prisma.reaction.upsert({
            where: {
                postId_userId_type: { postId, userId, type }, // Updated unique constraint check
            },
            update: { type },
            create: { userId, postId, type },
        });
    }
}

export const feedService = new FeedService();
