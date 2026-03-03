import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        '/supabase',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
