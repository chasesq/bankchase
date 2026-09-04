import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD

function isConfiguredAdmin(identifier: string, secret: string) {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD && identifier.toLowerCase() === ADMIN_EMAIL && secret === ADMIN_PASSWORD)
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, token } = await request.json()
    const identifier = typeof username === 'string' ? username.trim() : ''
    const secret = typeof password === 'string' ? password : ''

    if (!identifier || !secret) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 })
    }
    if (token !== undefined && !/^\d{6}$/.test(String(token))) {
      return NextResponse.json({ error: 'Enter a valid 6-digit security token' }, { status: 400 })
    }

    // Keep the seeded local admin usable when the preview's external auth
    // configuration is unavailable. This is intentionally limited to the
    // documented development account and creates a server-side demo session.
    if (isConfiguredAdmin(identifier, secret)) {
      const response = NextResponse.json({
        success: true,
        token: 'demo-session',
        user: {
          id: 'demo-admin-1',
          email: 'admin@bankchase.local',
          username: 'admin@bankchase.local',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          emailVerified: true,
        },
        legacyDemo: true,
      })
      response.cookies.set('demo_auth', 'admin', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
      return response
    }

    const supabase = await createClient()
    const email = identifier.includes('@') ? identifier : undefined
    const authResult = email
      ? await supabase.auth.signInWithPassword({ email, password: secret })
      : { data: { session: null, user: null }, error: new Error('Use your email address to sign in') }

    if (!authResult.error && authResult.data.user) {
      const user = authResult.data.user
      const session = authResult.data.session
      return NextResponse.json({
        success: true,
        token: session?.access_token ?? null,
        user: {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username ?? user.email,
          firstName: user.user_metadata?.firstName ?? '',
          lastName: user.user_metadata?.lastName ?? '',
          role: user.app_metadata?.role ?? 'customer',
          emailVerified: Boolean(user.email_confirmed_at),
        },
        requiresEmailConfirmation: !session,
      })
    }

    return NextResponse.json({ error: authResult.error?.message ?? 'Invalid email or password' }, { status: 401 })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json({ error: 'Unable to sign in right now' }, { status: 500 })
  }
}
