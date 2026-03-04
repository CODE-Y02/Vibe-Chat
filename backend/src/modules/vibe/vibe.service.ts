import prisma from '../../lib/prisma.js';

export const vibeService = {
    async archiveVibe(user1Id: string, user2Id: string, transcript: any[]) {
        // Ensure user1Id is always the smaller one to avoid duplicates if called twice
        const [u1, u2] = [user1Id, user2Id].sort();
        
        return prisma.vibeMemory.create({
            data: {
                user1Id: u1,
                user2Id: u2,
                transcript: transcript as any,
            }
        });
    },

    async getMemories(userId: string) {
        return prisma.vibeMemory.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: { select: { id: true, username: true, avatar: true } },
                user2: { select: { id: true, username: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};
