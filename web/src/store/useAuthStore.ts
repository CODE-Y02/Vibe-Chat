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
            // Parse the URL and replace the supabase host with our Vercel proxy.
            // We do NOT rely on NEXT_PUBLIC_SUPABASE_URL here because env vars
            // can be undefined at runtime in the browser. Instead we swap the
            // origin directly from the returned URL.
            const originalUrl = new URL(data.url);
            const proxiedUrl = data.url.replace(
                originalUrl.origin,                          // e.g. https://nujpmmtiaxhxzjgegaxs.supabase.co
                `${window.location.origin}/supabase`        // e.g. https://vibe-chat-iota.vercel.app/supabase
            );
            console.log('[Auth] Proxying OAuth via:', proxiedUrl);
            window.location.href = proxiedUrl;
        } else {
            console.error('[Auth] No URL returned from signInWithOAuth – cannot redirect.');
        }
    },

    logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
        window.location.href = "/login";
    },
}));
