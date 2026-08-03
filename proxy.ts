import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Proxy (formerly middleware)
 * Handles cross-cutting concerns like logging, security, and performance monitoring
 */

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/otp/request',
  '/api/admin/health',
]

export default function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  // Check if route is public
  const isPublic = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Clone response to add custom headers
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Request-ID', requestId)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Add performance header
  const duration = performance.now() - startTime
  response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)

  return response
}

// Configure which routes to apply proxy to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
