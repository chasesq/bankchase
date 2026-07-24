import { createClient } from '@supabase/supabase-js'
import { comparePassword, hashPassword } from '@/lib/auth'
import { inMemoryDb } from '@/lib/in-memory-db'
import { logLoginAttempt } from '@/lib/rbac'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withErrorHandler, validateRequiredFields, APIError } from '@/lib/api-error-handler'
import { triggerNotificationEvent } from '@/lib/inngest-events'

// Demo user credentials - Username-based authentication
const DEMO_USER = {
  id: 'demo-user-1',
  username: 'Lin Huang',
  email: 'linhuang011@gmail.com',
  password: 'Lin1122',
  first_name: 'Lin',
  last_name: 'Huang',
  role: 'customer',
  email_verified: true,
  firstName: 'Lin',
  lastName: 'Huang',
  role: 'customer',
  emailVerified: true,
}

async function handler(request: NextRequest) {
  console.log('[v0] Login attempt')

  const body = await request.json()
  const { username, password } = body

  // Validate required fields
  validateRequiredFields(body, ['username', 'password'])

  // Validate credentials
  if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
    throw new APIError(401, 'Invalid username or password', 'INVALID_CREDENTIALS')
  }

  // Create session cookie
  const cookieStore = await cookies()
  const userSession = {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    username: DEMO_USER.username,
    firstName: DEMO_USER.firstName,
    lastName: DEMO_USER.lastName,
    role: DEMO_USER.role,
    emailVerified: DEMO_USER.emailVerified,
  }

  cookieStore.set('auth_user', JSON.stringify(userSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

    // Normalize input (trim whitespace, case-insensitive for email)
    const normalizedIdentifier = loginIdentifier.trim().toLowerCase()
    const normalizedUsername = DEFAULT_USER.username.toLowerCase()
    const normalizedEmail = DEFAULT_USER.email.toLowerCase()

    // Check default demo user first
    if (
      (normalizedIdentifier === normalizedUsername || normalizedIdentifier === normalizedEmail) &&
      password === DEFAULT_USER.password
    ) {
      user = DEFAULT_USER
    } else {
      // In production, query database here for other users
      // For now, only demo user is available
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      )
    }

    if (!user) {
      // Log failed login attempt
      try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        // Don't log to DB for failed login of non-existent users
      } catch (err) {
        console.error('[v0] Error logging failed login:', err)
      }
      
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      )
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate 2FA code (6 digits)
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString()
    const supabase = getSupabase()

    // Save 2FA code to database with 5-minute expiration
    if (supabase && user.id) {
      try {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        await supabase.from('two_factor_codes').insert({
          user_id: user.id,
          code: twoFACode,
          expires_at: expiresAt,
          used: false,
        })

        // Log login attempt (pending 2FA)
        await logLoginAttempt(user.id, ip, userAgent, 'Web Browser', true)
      } catch (err) {
        console.error('[v0] Error saving 2FA code:', err)
      }
    }

    // Return 2FA pending response (don't create full session yet)
    return NextResponse.json(
      {
        success: false,
        requiresTwoFA: true,
        userId: user.id,
        email: user.email,
        // In production, send code via SMS/email, not in response
        message: 'A verification code has been sent to your registered phone/email.',
  // Trigger welcome notification event
  try {
    await triggerNotificationEvent({
      userId: DEMO_USER.id,
      type: 'alert',
      title: 'Welcome back!',
      message: `Welcome back, ${DEMO_USER.firstName}!`,
      channels: ['email', 'push'],
    })

    // Create a simple JWT-like token (in production, use proper JWT library)
    const token = Buffer.from(JSON.stringify({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      iat: Date.now(),
    })).toString('base64')

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error triggering welcome notification:', error)
  }

  console.log(`[v0] User ${DEMO_USER.username} logged in successfully`)

  return NextResponse.json(
    {
      success: true,
      token,
      user: userSession,
    },
    { status: 200 }
  )
}

export const POST = withErrorHandler(handler)
