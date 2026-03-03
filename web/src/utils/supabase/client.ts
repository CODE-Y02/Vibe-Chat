import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const isBrowser = typeof window !== 'undefined';
    const supabaseUrl = isBrowser 
        ? `${window.location.origin}/supabase` 
        : process.env.NEXT_PUBLIC_SUPABASE_URL!;

    return createBrowserClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
