import prisma from '../../lib/prisma.js';
import { Block, Report } from '@prisma/client';

export class ModerationService {
    async blockUser(blockerId: string, blockedId: string): Promise<Block> {
        return prisma.block.create({
            data: { blockerId, blockedId },
        });
    }

    async reportUser(reporterId: string, reportedId: string, reason: string): Promise<Report> {
        return prisma.report.create({
            data: { reporterId, reportedId, reason },
        });
    }
}

export const moderationService = new ModerationService();
