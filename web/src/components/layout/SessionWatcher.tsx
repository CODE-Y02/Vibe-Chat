"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { loadNSFWModel } from "@/lib/nsfwValidator";

/**
 * Watches the session for a RefreshTokenExpired error.
 * When the refresh token itself expires (after 7 days), we sign the user out
 * and redirect them to the login page rather than leaving them in a broken state.
 */
export function SessionWatcher() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.error === "RefreshTokenExpired") {
            console.warn("[SessionWatcher] Refresh token expired — signing out");
            signOut({ callbackUrl: "/login" });
        } else if (session?.user) {
            // Silently precache the AI moderation model in the background when logged in
            loadNSFWModel().catch(console.error);
        }
    }, [session?.error, session?.user]);

    return null;
}
