import { createClient } from "@/utils/supabase/server";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
    const supabase = await createClient();
    // Must use getUser() not getSession() in server actions — getSession() reads
    // from cookie cache and can return stale/invalid tokens server-side
    const { data: { user } } = await supabase.auth.getUser();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const headers = new Headers(options.headers);

    if (user) {
        // getSession gives us the actual token — but only call it after getUser() 
        // confirms the session is valid
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers.set("Authorization", `Bearer ${session.access_token}`);
        }
    }

    return fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });
}
