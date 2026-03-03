"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface SessionContextValue {
    data: { user: User | null; session: Session | null } | null;
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

        const watchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (mounted) {
                if (session) {
                    setData({ user: session.user, session: session });
                    setStatus("authenticated");
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
                    setData({ user: session.user, session: session });
                    setStatus("authenticated");
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
