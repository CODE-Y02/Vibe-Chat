import { createClient } from "@/utils/supabase/server";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const headers = new Headers(options.headers);
    if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    return fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });
}
