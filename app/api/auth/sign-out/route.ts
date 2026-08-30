import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return NextResponse.json({ error: 'Sign-out failed' }, { status: 400 })
    return NextResponse.json({ success: true, message: 'Signed out' })
  } catch (error) {
    return NextResponse.json({ error: 'Sign-out failed' }, { status: 400 })
  }
}
