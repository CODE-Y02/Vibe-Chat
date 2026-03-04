import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import prisma from './prisma.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface TokenPayload {
    userId: string;
}

export const verifyAccessToken = async (token: string): Promise<TokenPayload | null> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;

        // 🟢 OPTIMIZATION: Check for existing user first to avoid heavy upsert writes on every heartbeat
        let internalUser = await prisma.user.findUnique({
            where: { supabaseAuthId: user.id },
            select: { id: true }
        });

        if (!internalUser) {
            console.log(`[Auth] Creating internal record for new user: ${user.id}`);
            internalUser = await prisma.user.create({
                data: {
                    supabaseAuthId: user.id,
                    email: user.email ?? '',
                    username: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'user',
                    avatar: user.user_metadata?.avatar_url ?? undefined,
                },
                select: { id: true }
            });
        }

        return { userId: internalUser.id };
    } catch (err) {
        console.error('Error verifying Supabase token:', err);
        return null;
    }
};
