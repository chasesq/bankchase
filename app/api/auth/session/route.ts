import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ user: null, session: null })
    }

    const supabase = await createClient()
    const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (userError || !userData.user) {
      return NextResponse.json({ user: null, session: null })
    }

    return NextResponse.json(
      { user: userData.user, session: sessionData.session },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    // Missing preview configuration must behave like an anonymous session,
    // not a server error that can trap the client in an auth redirect loop.
    console.warn('[v0] Session fetch unavailable:', error)
    return NextResponse.json({ user: null, session: null })
  }
}
