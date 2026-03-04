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

    // 8-second timeout — prevents infinite loading when backend is unreachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
