import { Context } from 'hono';
import { userService } from './user.service.js';
import { Env } from '../../types.js';

export const getMe = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const user = await userService.getById(userId);
    return c.json(user);
};

export const getUserById = async (c: Context<Env>) => {
    const { id } = c.req.param();
    const user = await userService.getById(id);
    return c.json(user);
};

export const updateProfile = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const body = await c.req.json() as { username?: string; avatar?: string };
    const user = await userService.updateProfile(userId, body);
    return c.json(user);
};

export const searchUsers = async (c: Context<Env>) => {
    const { userId } = c.get('user');
    const q = c.req.query('q') ?? '';
    const users = await userService.searchUsers(q, userId);
    return c.json(users);
};
