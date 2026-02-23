import prisma from '../../lib/prisma.js';
import { AppError } from '../../lib/utils.js';
import { User, Friend } from '@prisma/client';

export class FriendService {
    async sendRequest(userId: string, friendId: string): Promise<Friend> {
        if (userId === friendId) throw new AppError(400, "You cannot friend yourself");

        const existing = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        });

        if (existing) throw new AppError(400, "Friend relationship already exists");

        return prisma.friend.create({
            data: { userId, friendId, status: 'PENDING' },
        });
    }

    async acceptRequest(userId: string, friendId: string): Promise<Friend> {
        const request = await prisma.friend.findUnique({
            where: { userId_friendId: { userId: friendId, friendId: userId } },
        });

        if (!request || request.status !== 'PENDING') {
            throw new AppError(404, "Friend request not found");
        }

        return prisma.friend.update({
            where: { id: request.id },
            data: { status: 'ACCEPTED' },
        });
    }

    async rejectRequest(userId: string, friendId: string): Promise<Friend> {
        const request = await prisma.friend.findUnique({
            where: { userId_friendId: { userId: friendId, friendId: userId } },
        });

        if (!request || request.status !== 'PENDING') {
            throw new AppError(404, 'Friend request not found');
        }

        return prisma.friend.delete({
            where: { id: request.id },
        });
    }

    async removeFriend(userId: string, friendId: string): Promise<Friend> {
        const friendship = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId, friendId, status: 'ACCEPTED' },
                    { userId: friendId, friendId: userId, status: 'ACCEPTED' },
                ],
            },
        });

        if (!friendship) {
            throw new AppError(404, 'Friendship not found');
        }

        return prisma.friend.delete({
            where: { id: friendship.id },
        });
    }

    async listFriends(userId: string): Promise<User[]> {
        const friends = await prisma.friend.findMany({
            where: {
                OR: [
                    { userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' },
                ],
            },
            include: {
                user: true,
                friend: true,
            },
        });

        return friends.map(f => (f.userId === userId ? f.friend : f.user));
    }
}

export const friendService = new FriendService();
