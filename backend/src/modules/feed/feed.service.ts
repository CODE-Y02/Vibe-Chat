import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

const safeAuthorSelect = {
    id: true,
    username: true,
    avatar: true,
} as const;

export class FeedService {
    /** 
     * Scalable Include: No _count joins needed.
     * We use pre-calculated integers for instant performance.
     */
    private getPostInclude(currentUserId: string): Prisma.PostInclude {
        return {
            author: { select: safeAuthorSelect },
            reactions: {
                where: { userId: currentUserId },
                select: { type: true, userId: true },
            },
            replies: {
                where: { parentId: { not: null }, deletedAt: null },
                take: 3,
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: safeAuthorSelect },
                    reactions: {
                        where: { userId: currentUserId },
                        select: { type: true, userId: true },
                    },
                },
            },
            repostOf: {
                include: {
                    author: { select: safeAuthorSelect },
                },
            },
            reposts: {
                where: { authorId: currentUserId, content: null, deletedAt: null },
                select: { id: true, authorId: true }
            }
        };
    }

    async createPost(authorId: string, content: string) {
        return prisma.post.create({
            data: { authorId, content },
            include: this.getPostInclude(authorId),
        });
    }

    async createReply(authorId: string, parentId: string, content: string) {
        return await prisma.$transaction(async (tx) => {
            const parent = await tx.post.findUnique({ where: { id: parentId, deletedAt: null } });
            if (!parent) throw new Error('Post not found or deleted');

            // 1. Create the reply
            const reply = await tx.post.create({
                data: { authorId, content, parentId },
                include: this.getPostInclude(authorId),
            });

            // 2. Increment parent's reply count
            await tx.post.update({
                where: { id: parentId },
                data: { repliesCount: { increment: 1 } }
            });

            return reply;
        });
    }

    async repost(authorId: string, repostOfId: string, content?: string) {
        return await prisma.$transaction(async (tx) => {
            const source = await tx.post.findUnique({ where: { id: repostOfId, deletedAt: null } });
            if (!source) throw new Error('Source post not found or deleted');

            const isQuote = !!content;

            if (isQuote) {
                const quote = await tx.post.create({
                    data: { authorId, content, repostOfId },
                    include: this.getPostInclude(authorId),
                });
                await tx.post.update({
                    where: { id: repostOfId },
                    data: { repostsCount: { increment: 1 } }
                });
                return { toggled: true, post: quote };
            }

            // Pure Repost Toggle logic
            const existing = await tx.post.findFirst({
                where: { authorId, repostOfId, content: null, parentId: null, deletedAt: null }
            });

            if (existing) {
                await tx.post.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
                await tx.post.update({ where: { id: repostOfId }, data: { repostsCount: { decrement: 1 } } });
                return { toggled: false };
            }

            const repost = await tx.post.create({
                data: { authorId, repostOfId },
                include: this.getPostInclude(authorId),
            });
            await tx.post.update({ where: { id: repostOfId }, data: { repostsCount: { increment: 1 } } });
            return { toggled: true, post: repost };
        });
    }

    async undoRepost(authorId: string, repostOfId: string) {
        return await prisma.$transaction(async (tx) => {
            const reposts = await tx.post.findMany({
                where: { authorId, repostOfId, content: null, parentId: null, deletedAt: null }
            });

            if (reposts.length > 0) {
                await tx.post.updateMany({
                    where: { id: { in: reposts.map(r => r.id) } },
                    data: { deletedAt: new Date() }
                });
                await tx.post.update({
                    where: { id: repostOfId },
                    data: { repostsCount: { decrement: reposts.length } }
                });
            }
            return { success: true };
        });
    }

    async deletePost(authorId: string, postId: string) {
        return await prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({ where: { id: postId, deletedAt: null } });
            if (!post) throw new Error('Post not found');
            if (post.authorId !== authorId) throw new Error('Unauthorized');

            const now = new Date();

            // 1. Soft delete the post
            await tx.post.update({ where: { id: postId }, data: { deletedAt: now } });

            // 2. Decrement parent counters if applicable
            if (post.parentId) {
                await tx.post.update({
                    where: { id: post.parentId },
                    data: { repliesCount: { decrement: 1 } }
                });
            }
            if (post.repostOfId) {
                await tx.post.update({
                    where: { id: post.repostOfId },
                    data: { repostsCount: { decrement: 1 } }
                });
            }

            // 3. Cascade soft-delete linked items
            await tx.post.updateMany({
                where: {
                    OR: [{ parentId: postId }, { repostOfId: postId }],
                    deletedAt: null
                },
                data: { deletedAt: now }
            });

            return { success: true };
        });
    }

    async getFeed(userId: string, cursor?: string, limit = 20) {
        // 🚀 SCALING FIX: Fetch friend IDs first to avoid slow OR joins in global post search
        const friendships = await prisma.friend.findMany({
            where: {
                OR: [
                    { userId: userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            },
            select: { userId: true, friendId: true }
        });

        const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
        
        // Include self
        const allowedAuthorIds = [...friendIds, userId];

        return prisma.post.findMany({
            where: {
                deletedAt: null,
                authorId: { in: allowedAuthorIds },
                parentId: null,
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
            where: { parentId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            include: this.getPostInclude(userId),
        });
    }

    async reactToPost(userId: string, postId: string, type: string) {
        return await prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({ where: { id: postId, deletedAt: null } });
            if (!post) throw new Error('Post not found');

            const oppositeType = type === 'like' ? 'dislike' : 'like';

            // 1. Check if the SAME reaction exists (Toggle off)
            const existing = await tx.reaction.findUnique({
                where: { postId_userId_type: { postId, userId, type } },
            });

            if (existing) {
                await tx.reaction.delete({ where: { id: existing.id } });
                const counterField = type === 'like' ? 'likesCount' : 'dislikesCount';
                await tx.post.update({ 
                    where: { id: postId }, 
                    data: { [counterField]: { decrement: 1 } } 
                });
                return { toggled: false };
            }

            // 2. Check and remove OPPOSITE reaction (Mutual Exclusivity)
            const opposite = await tx.reaction.findUnique({
                where: { postId_userId_type: { postId, userId, type: oppositeType } },
            });

            if (opposite) {
                await tx.reaction.delete({ where: { id: opposite.id } });
                const oppositeCounter = oppositeType === 'like' ? 'likesCount' : 'dislikesCount';
                await tx.post.update({
                    where: { id: postId },
                    data: { [oppositeCounter]: { decrement: 1 } }
                });
            }

            // 3. Add the new reaction
            const reaction = await tx.reaction.create({ data: { userId, postId, type } });
            const counterField = type === 'like' ? 'likesCount' : 'dislikesCount';
            await tx.post.update({ 
                where: { id: postId }, 
                data: { [counterField]: { increment: 1 } } 
            });
            
            return { toggled: true, reaction };
        });
    }
}

export const feedService = new FeedService();
