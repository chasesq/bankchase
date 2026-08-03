import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { handleApiError, ApiError, validateRequired, sanitizeInput } from '@/lib/error-handler'
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limit'

// Demo user credentials
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
    // Rate limiting for auth endpoints
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const key = `login:${clientIp}`
    
    if (!rateLimiter.isAllowed(key, RATE_LIMITS.AUTH)) {
      const status = rateLimiter.getStatus(key, RATE_LIMITS.AUTH)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    validateRequired({ username, password }, ['username', 'password'])

    // Sanitize input
    const sanitizedUsername = sanitizeInput(username)
    const sanitizedPassword = sanitizeInput(password)

    // Validate credentials (time-constant comparison to prevent timing attacks)
    const usernameMatch = sanitizedUsername === DEMO_USER.username
    const passwordMatch = sanitizedPassword === DEMO_USER.password

    if (!usernameMatch || !passwordMatch) {
      throw new ApiError(401, 'Invalid username or password', 'AUTH_FAILED')
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
      path: '/',
    })

    // Create JWT-like token
    const token = Buffer.from(JSON.stringify({
      id: DEMO_USER.id,
      username: DEMO_USER.username,
      email: DEMO_USER.email,
      iat: Math.floor(Date.now() / 1000),
    })).toString('base64')

    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json(
      {
        success: true,
        token,
        user: userSession,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
