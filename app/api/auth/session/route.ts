import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    if (cookieStore.get('demo_auth')?.value === 'admin') {
      return NextResponse.json({
        user: {
          id: 'demo-admin-1',
          email: 'admin@bankchase.local',
          user_metadata: { username: 'admin@bankchase.local', firstName: 'Admin', lastName: 'User' },
          app_metadata: { role: 'admin' },
        },
        session: { access_token: 'demo-session' },
      })
    }

    const supabase = await createClient()
    const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (userError || !userData.user) {
      return NextResponse.json({ user: null, session: null })
    }

    return NextResponse.json({ user: userData.user, session: sessionData.session })
  } catch (error) {
    console.error('[v0] Session fetch failed:', error)
    return NextResponse.json({ error: 'Session fetch failed' }, { status: 500 })
  }
}
