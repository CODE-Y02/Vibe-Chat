import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with cross-browser cookies.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup') || request.nextUrl.pathname.startsWith('/auth');
    const isPublicPath = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/terms') || request.nextUrl.pathname.startsWith('/privacy') || request.nextUrl.pathname.startsWith('/blog') || isAuthPage;

    if (!user && !isPublicPath) {
        // protect routes
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthPage) {
        // redirect away from auth page if already logged in
        return NextResponse.redirect(new URL('/feed', request.url))
    }

    return supabaseResponse
}
