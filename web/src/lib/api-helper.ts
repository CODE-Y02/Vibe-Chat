import { createClient } from "@/utils/supabase/server";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const headers = new Headers(options.headers);

    if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers.set("Authorization", `Bearer ${session.access_token}`);
        }
    }

    // 60-second timeout — wait for Render free tier cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        return await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}
