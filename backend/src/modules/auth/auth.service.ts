import prisma from '../../lib/prisma.js';
import { generateTokens, hashPassword, comparePassword, verifyRefreshToken } from '../../lib/auth.js';
import { AppError } from '../../lib/utils.js';
import { User } from '@prisma/client';

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export class AuthService {
    async signup(data: { username?: string; email?: string; password?: string }): Promise<AuthResponse> {
        if (data.username) {
            const existing = await prisma.user.findUnique({ where: { username: data.username } });
            if (existing) throw new AppError(400, 'Username already taken');
        }

        if (data.email) {
            const existing = await prisma.user.findUnique({ where: { email: data.email } });
            if (existing) throw new AppError(400, 'Email already registered');
        }

        const passwordHash = data.password ? await hashPassword(data.password) : undefined;

        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash,
                isAnonymous: !data.password,
            },
        });

        const tokens = generateTokens({
            userId: user.id,
            username: user.username || undefined,
            isAnonymous: user.isAnonymous,
        });

        return { user, ...tokens };
    }

    async login(data: { username?: string; email?: string; password?: string }): Promise<AuthResponse> {
        if (!data.password) throw new AppError(400, 'Password is required');

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ username: data.username }, { email: data.email }],
            },
        });

        if (!user || !user.passwordHash || !(await comparePassword(data.password, user.passwordHash))) {
            throw new AppError(401, 'Invalid credentials');
        }

        const tokens = generateTokens({
            userId: user.id,
            username: user.username || undefined,
            isAnonymous: user.isAnonymous,
        });

        return { user, ...tokens };
    }

    async createAnonymousSession(): Promise<AuthResponse> {
        const user = await prisma.user.create({
            data: {
                isAnonymous: true,
            },
        });

        const tokens = generateTokens({
            userId: user.id,
            isAnonymous: true,
        });

        return { user, ...tokens };
    }

    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) throw new AppError(401, 'Invalid or expired refresh token');

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) throw new AppError(401, 'User not found');

        return generateTokens({
            userId: user.id,
            username: user.username || undefined,
            isAnonymous: user.isAnonymous,
        });
    }
}

export const authService = new AuthService();
