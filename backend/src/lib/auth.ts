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

        // Upsert — handles the case where the webhook hasn't fired yet
        // (user authenticated but our DB doesn't have them yet)
        const internalUser = await prisma.user.upsert({
            where: { supabaseAuthId: user.id },
            update: {
                // Keep email + avatar in sync in case it changed
                email: user.email ?? '',
                avatar: user.user_metadata?.avatar_url ?? undefined,
            },
            create: {
                supabaseAuthId: user.id,
                email: user.email ?? '',
                username: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'user',
                avatar: user.user_metadata?.avatar_url ?? undefined,
            },
            select: { id: true }
        });

        return { userId: internalUser.id };
    } catch (err) {
        console.error('Error verifying Supabase token:', err);
        return null;
    }
};
