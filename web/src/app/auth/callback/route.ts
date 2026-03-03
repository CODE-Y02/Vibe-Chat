import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // Get the path the user wanted to redirect to, or default to feed
    const next = searchParams.get('next') ?? '/feed'

    if (code) {
        const supabase = await createClient()
        // Exchange the magic link or oauth code for an actual session cookie
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // successful Auth!
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error("Supabase Session Error:", error.message)
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Authentication Failed`)
}
