import { authMiddleware } from '@descope/nextjs-sdk/server'

export default authMiddleware({
  projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID ?? '',
  redirectUrl: '/sign-in',
  publicRoutes: ['/', '/landing', '/sign-in', '/sign-up', '/api/public'],
})

export const config = {
  matcher: ['/((?!_next|.*\\.[\\w]+$).*)'],
}
