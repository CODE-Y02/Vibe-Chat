import { Context } from 'hono';
import { authService } from './auth.service.js';
import { AppError } from '../../lib/utils.js';
import { Env } from '../../types.js';
import { SignupDTO, LoginDTO, RefreshDTO } from './auth.dto.js';

export const signup = async (c: Context<Env>) => {
    const body: SignupDTO = await c.req.json();
    const result = await authService.signup(body);
    return c.json(result, 201);
};

export const login = async (c: Context<Env>) => {
    const body: LoginDTO = await c.req.json();
    const result = await authService.login(body);
    return c.json(result);
};

export const anonymous = async (c: Context<Env>) => {
    const result = await authService.createAnonymousSession();
    return c.json(result, 201);
};

export const refresh = async (c: Context<Env>) => {
    const body: RefreshDTO = await c.req.json();
    if (!body.refreshToken) throw new AppError(400, 'Refresh token is required');
    const result = await authService.refreshTokens(body.refreshToken);
    return c.json(result);
};
