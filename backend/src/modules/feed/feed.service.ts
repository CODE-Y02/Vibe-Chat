import prisma from '../../lib/prisma.js';

const safeAuthorSelect = {
    id: true,
    username: true,
    avatar: true,
} as const;

// Reusable include for a post with author, reactions, reply preview, repost preview
const postInclude = {
    author: { select: safeAuthorSelect },
    reactions: true,
    // Preview first 3 direct replies
    replies: {
        where: { parentId: { not: null } },  // only direct replies, not nested
        take: 3,
        orderBy: { createdAt: 'asc' as const },
        include: {
            author: { select: safeAuthorSelect },
            reactions: true,
            _count: { select: { replies: true } },
        },
    },
    // Embed the original post for reposts / quote posts
    repostOf: {
        include: { author: { select: safeAuthorSelect } },
    },
    _count: { select: { replies: true, reposts: true } },
};

export class FeedService {
    /** Create a top-level post */
    async createPost(authorId: string, content: string) {
        return prisma.post.create({
            data: { authorId, content },
            include: postInclude,
        });
    }

    /** Reply to a post (creates a Post with parentId) */
    async createReply(authorId: string, parentId: string, content: string) {
        // Verify parent exists
        const parent = await prisma.post.findUnique({ where: { id: parentId } });
        if (!parent) throw new Error('Post not found');

        return prisma.post.create({
            data: { authorId, content, parentId },
            include: postInclude,
        });
    }

    /** Repost (no content) or Quote post (with content) */
    async repost(authorId: string, repostOfId: string, content?: string) {
        const original = await prisma.post.findUnique({ where: { id: repostOfId } });
        if (!original) throw new Error('Post not found');

        return prisma.post.create({
            data: { authorId, content: content ?? null, repostOfId },
            include: postInclude,
        });
    }

    /** Undo repost */
    async undoRepost(authorId: string, repostOfId: string) {
        await prisma.post.deleteMany({
            where: { authorId, repostOfId, parentId: null },
        });
        return { success: true };
    }

    /** Feed: top-level posts from self + friends, newest first */
    async getFeed(userId: string, page = 1, limit = 20) {
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
                parentId: null, // only top-level posts in main feed
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: postInclude,
        });
    }

    /** All replies for a post (paginated) */
    async getReplies(parentId: string, page = 1, limit = 20) {
        return prisma.post.findMany({
            where: { parentId },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
            include: postInclude,
        });
    }

    /** Like / unlike (toggle via upsert) */
    async reactToPost(userId: string, postId: string, type: string) {
        // Check if reaction already exists
        const existing = await prisma.reaction.findUnique({
            where: { postId_userId_type: { postId, userId, type } },
        });

        if (existing) {
            // Toggle off
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
