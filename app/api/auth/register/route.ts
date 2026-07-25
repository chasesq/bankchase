import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function validatePassword(password: string) {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letters')
  if (!/[0-9]/.test(password)) errors.push('Password must contain numbers')
  return { valid: errors.length === 0, errors }
}

async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo purposes - use bcrypt in production
  return Buffer.from(password).toString('base64')
}

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password is too weak', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate username from email
    const userId = 'user-' + Math.random().toString(36).substr(2, 9)
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 5)

    const newUser = {
      id: userId,
      email,
      username,
      firstName: firstName || 'User',
      lastName: lastName || '',
      role: 'customer',
      emailVerified: false,
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify(newUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Create a simple JWT-like token
    const token = Buffer.from(JSON.stringify({
      sub: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      iat: Date.now(),
    })).toString('base64')

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: 'customer',
          emailVerified: false,
        },
        message: 'Registration successful.',
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
