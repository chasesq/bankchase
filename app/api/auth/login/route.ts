import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json({ error: 'Unable to sign in right now' }, { status: 500 })
  }
}
