
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    // Validate required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[Middleware] Critical: Supabase environment variables not configured');
        // Only redirect if not already on error page
        if (!request.nextUrl.pathname.startsWith('/error')) {
            return NextResponse.redirect(new URL('/error/config', request.url));
        }
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        // If user is NOT logged in
        // Protect strict route paths (like /dashboard, /products, etc.)
        // But allow public access to Landing Page ("/") and Auth ("/login", "/auth")

        const isPublicRoute =
            request.nextUrl.pathname === '/' ||
            request.nextUrl.pathname.startsWith('/login') ||
            request.nextUrl.pathname.startsWith('/auth');

        if (!isPublicRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } else {
        // If user IS logged in
        // If they visit the Landing Page ("/") or Login ("/login"), redirect to Dashboard
        if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes, though some might need protection)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
