import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEMO_USER = {
  id: 'demo-user-1',
  username: 'Lin Huang',
  email: 'linhuang011@gmail.com',
  password: 'Lin1122',
  firstName: 'Lin',
  lastName: 'Huang',
  role: 'customer',
  emailVerified: true,
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

    if (identifier.toLowerCase() === DEMO_USER.email.toLowerCase() && secret === DEMO_USER.password) {
      return NextResponse.json({
        success: true,
        token: null,
        user: { id: DEMO_USER.id, email: DEMO_USER.email, username: DEMO_USER.username, firstName: DEMO_USER.firstName, lastName: DEMO_USER.lastName, role: DEMO_USER.role, emailVerified: DEMO_USER.emailVerified },
        legacyDemo: true,
      })
    }

    return NextResponse.json({ error: authResult.error?.message ?? 'Invalid email or password' }, { status: 401 })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json({ error: 'Unable to sign in right now' }, { status: 500 })
  }
}
