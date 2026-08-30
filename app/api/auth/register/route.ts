import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function validatePassword(password: string) {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number')
  return errors
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const username = typeof body.username === 'string' ? body.username.trim() : email.split('@')[0]

    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length) return NextResponse.json({ error: 'Password is too weak', details: passwordErrors }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, firstName, lastName } },
    })

    if (error) {
      const status = /already registered|already exists/i.test(error.message) ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    if (!data.user) return NextResponse.json({ error: 'Unable to create your account' }, { status: 500 })

    const user = {
      id: data.user.id,
      email: data.user.email,
      username,
      firstName,
      lastName,
      role: 'customer',
      emailVerified: Boolean(data.user.email_confirmed_at),
    }

    return NextResponse.json({
      success: true,
      user,
      token: data.session?.access_token ?? null,
      requiresEmailConfirmation: !data.session,
      message: data.session ? 'Registration successful.' : 'Check your email to confirm your account before signing in.',
    }, { status: data.session ? 201 : 202 })
  } catch (error) {
    console.error('[v0] Register error:', error)
    return NextResponse.json({ error: 'Unable to create your account right now' }, { status: 500 })
  }
}
