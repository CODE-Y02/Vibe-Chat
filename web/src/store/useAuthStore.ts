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
    login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    login: async (credentials) => {
        const result = await nextAuthSignIn("credentials", {
            ...credentials,
            redirect: false, // handle redirect manually for better error UX
        });

        if (result?.error) {
            throw new Error("Invalid username or password");
        }

        // Redirect to chat on success
        window.location.href = "/chat";
    },
    logout: async () => {
        await nextAuthSignOut({ callbackUrl: "/" });
        set({ user: null, isAuthenticated: false });
    },
}));
