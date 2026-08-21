import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
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
