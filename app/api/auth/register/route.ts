import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

    const supabase = getSupabase()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate username from email
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 9)

    // Create user with 'customer' role (regular user, not admin)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          username,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          email_verified: false,
          role: 'customer', // Regular users get 'customer' role, strictly isolated
        },
      ])
      .select()
      .single()

    if (createError || !newUser) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create default checking account with $0.00 balance
    try {
      await supabase
        .from('accounts')
        .insert([
          {
            user_id: newUser.id,
            account_type: 'Checking',
            account_number: generateAccountNumber(),
            routing_number: '021000021',
            balance: 0.00,
            bank_name: 'Chase Bank',
            is_external: false,
          },
        ])
    } catch (err) {
      console.error('Account creation error:', err)
    }

    // Send OTP for email verification
    try {
      await otpService.createOTP(email)
    } catch (err) {
      console.error('Failed to send OTP:', err)
      // Don't fail registration if OTP fails
    const userId = 'user-' + Math.random().toString(36).substr(2, 9)
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 5)

    const newUser = {
      id: userId,
      email,
      username,
      firstName: firstName || 'User',
      lastName: lastName || '',
      role: 'customer',
      emailVerified: true,
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify({
      id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'customer',
          emailVerified: false,
        }), {
      httpOnly: true, 
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
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'customer',
          emailVerified: false,
        },
        message: 'Registration successful. Please verify your email with the OTP sent.',
        token,
        user: newUser,
        message: 'Registration successful.',
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
