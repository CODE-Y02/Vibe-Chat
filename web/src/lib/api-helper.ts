import { auth } from "@/auth";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
    const session = await auth();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const headers = new Headers(options.headers);
    if (session?.accessToken) {
        headers.set("Authorization", `Bearer ${session.accessToken}`);
    }

    return fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });
}
