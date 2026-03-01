import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

const safeAuthorSelect = {
    id: true,
    username: true,
    avatar: true,
} as const;

export class FeedService {
    /** 
     * Helper to generate optimized include object.
     */
    private getPostInclude(currentUserId: string): Prisma.PostInclude {
        return {
            author: { select: safeAuthorSelect },
            reactions: {
                where: { userId: currentUserId },
                select: { type: true, userId: true },
            },
            replies: {
                where: { parentId: { not: null } },
                take: 3,
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: safeAuthorSelect },
                    _count: { select: { reactions: true, replies: true } },
                    reactions: {
                        where: { userId: currentUserId },
                        select: { type: true, userId: true },
                    },
                },
            },
            repostOf: {
                include: {
                    author: { select: safeAuthorSelect },
                    _count: { select: { reactions: true, replies: true, reposts: true } }
                },
            },
            _count: { select: { replies: true, reposts: true, reactions: true } },
        };
    }

    async createPost(authorId: string, content: string) {
        return prisma.post.create({
            data: { authorId, content },
            include: this.getPostInclude(authorId),
        });
    }

    async createReply(authorId: string, parentId: string, content: string) {
        const parent = await prisma.post.findUnique({ where: { id: parentId } });
        if (!parent) throw new Error('Post not found');

        return prisma.post.create({
            data: { authorId, content, parentId },
            include: this.getPostInclude(authorId),
        });
    }

    async repost(authorId: string, repostOfId: string, content?: string) {
        return prisma.post.create({
            data: { authorId, content: content ?? null, repostOfId },
            include: this.getPostInclude(authorId),
        });
    }

    async undoRepost(authorId: string, repostOfId: string) {
        await prisma.post.deleteMany({
            where: { authorId, repostOfId, parentId: null },
        });
        return { success: true };
    }

    /** 
     * Scalable Feed Retrieval
     * Instead of loading all friend IDs into Node.js memory, we use a subquery 
     * to fetch posts from self or anyone you are friends with.
     */
    async getFeed(userId: string, cursor?: string, limit = 20) {
        // We look for posts where author is me OR author is a friend (ACCEPTED)
        return prisma.post.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    {
                        author: {
                            OR: [
                                { friendOf: { some: { userId: userId, status: 'ACCEPTED' } } },
                                { friends: { some: { friendId: userId, status: 'ACCEPTED' } } }
                            ]
                        }
                    }
                ],
                parentId: null, // Only top-level posts on main feed
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            include: this.getPostInclude(userId),
        });
    }

    async getReplies(parentId: string, userId: string, cursor?: string, limit = 20) {
        return prisma.post.findMany({
            where: { parentId },
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            include: this.getPostInclude(userId),
        });
    }

    async reactToPost(userId: string, postId: string, type: string) {
        const existing = await prisma.reaction.findUnique({
            where: { postId_userId_type: { postId, userId, type } },
        });

        if (existing) {
            await prisma.reaction.delete({ where: { id: existing.id } });
            return { toggled: false };
        }

        const reaction = await prisma.reaction.create({
            data: { userId, postId, type },
        });
        return { toggled: true, reaction };
    }
}

export const feedService = new FeedService();
