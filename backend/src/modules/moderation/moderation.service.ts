import prisma from '../../lib/prisma.js';
import { Block, Report } from '@prisma/client';
import redis, { USER_SHADOWBANNED_PREFIX } from '../../services/redis.service.js';

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

    async autoFlag(userId: string): Promise<{ strikes: number; shadowbanned: boolean }> {
        const strikeKey = `strikes:${userId}`;
        const strikes = await redis.incr(strikeKey);

        // Expire strikes after 24 hours just to prevent infinite accumulation of false positives over months
        if (strikes === 1) {
            await redis.expire(strikeKey, 86400);
        }

        let shadowbanned = false;
        if (strikes >= 3) {
            await redis.set(`${USER_SHADOWBANNED_PREFIX}${userId}`, 'true');
            shadowbanned = true;
            console.log(`[ModerationService] User ${userId} shadowbanned due to AI moderation flags.`);
        }

        return { strikes, shadowbanned };
    }
}

export const moderationService = new ModerationService();
