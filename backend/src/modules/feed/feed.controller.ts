import { Context } from 'hono';
import { feedService } from './feed.service.js';
import { Env } from '../../types.js';

export const createPost = async (c: Context<Env>) => {
    const user = c.get('user');
    const { content } = (await c.req.json()) as { content: string };
    const result = await feedService.createPost(user.userId, content);
    return c.json(result, 201);
};

export const getFeed = async (c: Context<Env>) => {
    const user = c.get('user');
    const query = c.req.query();
    const page = Number(query.page) || 1;
    const result = await feedService.getFeed(user.userId, page);
    return c.json(result);
};

export const reactToPost = async (c: Context<Env>) => {
    const user = c.get('user');
    const { postId, type } = (await c.req.json()) as { postId: string; type: string };
    const result = await feedService.reactToPost(user.userId, postId, type);
    return c.json(result);
};
