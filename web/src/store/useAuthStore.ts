import { create } from 'zustand';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

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
    login: (credentials: { username?: string; email?: string; password?: string; isAnonymous?: boolean }) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    login: async (credentials) => {
        try {
            await nextAuthSignIn("credentials", {
                ...credentials,
                isAnonymous: credentials.isAnonymous ? "true" : "false",
                redirect: true,
                callbackUrl: "/chat",
            });
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    },
    logout: async () => {
        await nextAuthSignOut({ callbackUrl: "/" });
        set({ user: null, isAuthenticated: false });
    },
}));
