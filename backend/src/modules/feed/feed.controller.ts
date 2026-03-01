import { Context } from 'hono';
import { feedService } from './feed.service.js';
import { Env } from '../../types.js';

export const createPost = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const { content } = (await c.req.json()) as { content: string };
    return c.json(await feedService.createPost(userId, content), 201);
};

export const getFeed = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const page = Number(c.req.query('page')) || 1;
    return c.json(await feedService.getFeed(userId, page));
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
    const { parentId } = c.req.param();
    const page = Number(c.req.query('page')) || 1;
    return c.json(await feedService.getReplies(parentId, page));
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
