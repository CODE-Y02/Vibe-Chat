import prisma from '../../lib/prisma.js';
import { AppError } from '../../lib/utils.js';

// Fields safe to expose — never return passwordHash
const safeUserSelect = {
    id: true,
    username: true,
    email: true,
    avatar: true,
    createdAt: true,
    updatedAt: true,
} as const;

export class UserService {
    async getById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: safeUserSelect,
        });

        if (!user) throw new AppError(404, 'User not found');
        return user;
    }

    async updateProfile(userId: string, data: { username?: string; avatar?: string }) {
        if (data.username) {
            const existing = await prisma.user.findFirst({
                where: { username: data.username, NOT: { id: userId } },
            });
            if (existing) throw new AppError(400, 'Username already taken');
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.username && { username: data.username }),
                ...(data.avatar && { avatar: data.avatar }),
            },
            select: safeUserSelect,
        });

        return user;
    }

    async searchUsers(query: string, currentUserId: string) {
        if (!query || query.length < 2) return [];

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: currentUserId } }, // exclude self
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: safeUserSelect,
            take: 20,
        });

        return users;
    }
}

export const userService = new UserService();
