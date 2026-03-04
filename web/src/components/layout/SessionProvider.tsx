"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface SessionContextValue {
    data: { 
        user: User | null; 
        session: Session | null;
        internalId: string | null;
        userProfile: any | null;
    } | null;
    status: "loading" | "authenticated" | "unauthenticated";
}

const SessionContext = createContext<SessionContextValue>({
    data: null,
    status: "loading",
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [status, setStatus] = useState<SessionContextValue["status"]>("loading");
    const [data, setData] = useState<SessionContextValue["data"]>(null);

    useEffect(() => {
        let mounted = true;

        const fetchInternalProfile = async (session: Session) => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                const res = await fetch(`${baseUrl}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                });
                if (res.ok && mounted) {
                    const profile = await res.json();
                    setData(prev => prev ? { ...prev, internalId: profile.id, userProfile: profile } : null);
                }
            } catch (err) {
                console.error("Failed to fetch internal profile:", err);
            }
        };

        const watchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                if (session) {
                    setData({ user: session.user, session: session, internalId: null, userProfile: null });
                    setStatus("authenticated");
                    fetchInternalProfile(session);
                } else {
                    setData(null);
                    setStatus("unauthenticated");
                }
            }
        };

        watchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session) {
                    setData({ user: session.user, session: session, internalId: null, userProfile: null });
                    setStatus("authenticated");
                    fetchInternalProfile(session);
                } else {
                    setData(null);
                    setStatus("unauthenticated");
                }
            }
        );

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <SessionContext.Provider value={{ data, status }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}

export async function signOut() {
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
}
