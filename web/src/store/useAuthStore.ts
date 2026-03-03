import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export interface User {
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'idle';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    login: (email: string, username?: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    login: async (email: string, username?: string) => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: username ? { full_name: username } : undefined
            },
        });

        if (error) {
            throw new Error(error.message);
        }
    },
    loginWithGoogle: async () => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                skipBrowserRedirect: true,
            },
        });

        if (error) {
            throw new Error(error.message);
        }

        if (data?.url) {
            // Replace the direct Supabase URL with our proxied URL to bypass ISP blocks
            const proxiedUrl = data.url.replace(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                `${window.location.origin}/supabase`
            );
            window.location.href = proxiedUrl;
        }
    },
    logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
        window.location.href = "/login";
    },
}));
