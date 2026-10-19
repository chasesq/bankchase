import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SRT_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.SRT_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SRT_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SRT_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SRT_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SRT_SUPABASE_ANON_KEY

  const normalizedUrl = supabaseUrl?.trim()
  const normalizedKey = supabaseKey?.trim()

  // Preview builds can start before optional project variables are injected.
  // Do not construct an SSR client until both values are real and usable.
  if (!normalizedUrl || !normalizedKey || !normalizedUrl.startsWith('http')) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(normalizedUrl, normalizedKey, {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl
    const publicPaths = new Set(['/login', '/sign-in', '/signup', '/sign-up'])
    const isAuthCallback = pathname === '/auth/callback'
    const isPublicPath = publicPaths.has(pathname) || isAuthCallback || pathname.startsWith('/_next/')

    if (!user && !isPublicPath && !pathname.startsWith('/api/auth/')) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (user && publicPaths.has(pathname)) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/'
      dashboardUrl.search = ''
      return NextResponse.redirect(dashboardUrl)
    }
  } catch (error) {
    console.warn('[Supabase] Session refresh skipped:', error)
  }

  return supabaseResponse
}
