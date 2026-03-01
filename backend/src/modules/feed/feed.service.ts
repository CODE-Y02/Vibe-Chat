import prisma from '../../lib/prisma.js';

const safeAuthorSelect = {
    id: true,
    username: true,
    avatar: true,
} as const;

export class FeedService {
    /** Helper to generate optimized include object */
    private getPostInclude(currentUserId: string) {
        return {
            author: { select: safeAuthorSelect },
            // Only include current user's reaction to keep payload small
            reactions: {
                where: { userId: currentUserId },
                select: { type: true, userId: true },
            },
            // Preview first 3 direct replies
            replies: {
                where: { parentId: { not: null } },
                take: 3,
                orderBy: { createdAt: 'asc' as const },
                include: {
                    author: { select: safeAuthorSelect },
                    _count: { select: { reactions: true, replies: true } },
                    // Check if user liked the reply too
                    reactions: {
                        where: { userId: currentUserId },
                        select: { type: true },
                    },
                },
            },
            repostOf: {
                include: { author: { select: safeAuthorSelect } },
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

    /** Optimized Feed with Cursor Pagination */
    async getFeed(userId: string, cursor?: string, limit = 20) {
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
                parentId: null,
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1, // Fetch one extra to determine if there's a next page
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0, // Skip the cursor itself
            include: this.getPostInclude(userId),
        });
    }

    /** Optimized Replies with Cursor Pagination */
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
