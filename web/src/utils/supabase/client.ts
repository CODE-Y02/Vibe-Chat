import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // IMPORTANT: We use the Vercel proxy path as the Supabase URL.
    // This means ALL browser-side Supabase calls (getSession, onAuthStateChange,
    // signOut, signInWithOAuth etc.) go to /supabase/* on our own domain.
    // Next.js rewrites /supabase/* → supabase.co/* transparently on the edge,
    // so the browser NEVER touches supabase.co directly (bypasses Jio ISP block).
    const supabaseProxyUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/supabase`
        : process.env.NEXT_PUBLIC_SUPABASE_URL!; // server-side: use real URL (not blocked)

    return createBrowserClient(
        supabaseProxyUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

