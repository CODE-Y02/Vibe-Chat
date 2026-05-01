import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import prisma from './prisma.js';
import redis, { AUTH_CACHE_PREFIX } from '../services/redis.service.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface TokenPayload {
    userId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token verification with Redis cache
//
// Problem: Every socket connection (and every REST request) was making two
// serial network calls: (1) Supabase HTTPS for getUser() and (2) Postgres for
// user lookup. Under load this is the dominant source of latency.
//
// Solution: Cache the result in Redis for 5 minutes, keyed by a SHA-256 hash
// of the token. We hash the token before storing it as a key so that raw JWTs
// never appear in Redis keyspace (security hygiene).
//
// TTL is kept to 5 minutes (much shorter than Supabase's 1-hour token expiry)
// so that a revoked session expires from cache within 5 minutes.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_CACHE_TTL = 300; // 5 minutes

async function tokenHash(token: string): Promise<string> {
    // Node.js built-in — no extra dependencies
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(token).digest('hex');
}

export const verifyAccessToken = async (token: string): Promise<TokenPayload | null> => {
    try {
        // 1. Check cache first
        const hash = await tokenHash(token);
        const cacheKey = `${AUTH_CACHE_PREFIX}${hash}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached) as TokenPayload;
        }

        // 2. Cache miss — verify against Supabase
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) return null;

        // 3. Ensure internal user record exists (create on first login)
        let internalUser = await prisma.user.findUnique({
            where: { supabaseAuthId: user.id },
            select: { id: true },
        });

        if (!internalUser) {
            console.log(`[Auth] Creating internal record for new user: ${user.id}`);
            internalUser = await prisma.user.create({
                data: {
                    supabaseAuthId: user.id,
                    email: user.email ?? '',
                    username:
                        user.user_metadata?.full_name ??
                        user.email?.split('@')[0] ??
                        'user',
                    avatar: user.user_metadata?.avatar_url ?? undefined,
                },
                select: { id: true },
            });
        }

        const payload: TokenPayload = { userId: internalUser.id };

        // 4. Cache the verified payload
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', TOKEN_CACHE_TTL);

        return payload;
    } catch (err) {
        console.error('[Auth] Token verification error:', err);
        return null;
    }
};
