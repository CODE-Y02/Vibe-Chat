import { Context } from 'hono';
import { feedService } from './feed.service.js';
import { Env } from '../../types.js';
import { AppError } from '../../lib/utils.js';
import prisma from '../../lib/prisma.js';

let _io: any = null;
export const setFeedIO = (io: any) => { _io = io; };

export const createPost = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { content } = (await c.req.json()) as { content: string };
    if (!content?.trim()) throw new AppError(400, 'Content is required');

    const post = await feedService.createPost(userId, content);

    // 🔔 REAL-TIME: Signal friends only (No fan-out of heavy content)
    if (_io) {
        const friendships = await prisma.friend.findMany({
            where: {
                OR: [
                    { userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            },
            select: { userId: true, friendId: true }
        });

        const friendIds = friendships.map((f: { userId: string; friendId: string }) => f.userId === userId ? f.friendId : f.userId);
        
        // Notify each friend room
        friendIds.forEach((fid: string) => {
            _io.to(fid).emit('new_post', { authorId: userId });
        });
    }

    return c.json(post, 201);
};

export const deletePost = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { postId } = c.req.param();
    try {
        await feedService.deletePost(userId, postId);
        return c.json({ success: true });
    } catch (err: any) {
        return c.json({ error: err.message }, 400);
    }
};

export const getFeed = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const cursor = c.req.query('cursor');
    const limit = Number(c.req.query('limit')) || 20;

    const posts = await feedService.getFeed(userId, cursor, limit);

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
    }

    return c.json({ data: posts, nextCursor });
};

export const reactToPost = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { postId, type } = (await c.req.json()) as { postId: string; type: string };
    return c.json(await feedService.reactToPost(userId, postId, type));
};

export const createReply = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { parentId } = c.req.param();
    const { content } = (await c.req.json()) as { content: string };
    return c.json(await feedService.createReply(userId, parentId, content), 201);
};

export const getReplies = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { parentId } = c.req.param();
    const cursor = c.req.query('cursor');
    const limit = Number(c.req.query('limit')) || 20;

    const replies = await feedService.getReplies(parentId, userId, cursor, limit);

    let nextCursor: string | undefined = undefined;
    if (replies.length > limit) {
        const nextItem = replies.pop();
        nextCursor = nextItem?.id;
    }

    return c.json({ data: replies, nextCursor });
};

export const repost = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { postId } = c.req.param();
    const body = await c.req.json().catch(() => ({})) as { content?: string };
    return c.json(await feedService.repost(userId, postId, body.content), 201);
};

export const undoRepost = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { postId } = c.req.param();
    return c.json(await feedService.undoRepost(userId, postId));
};
