import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/email/senders
 * List all sender identities for the user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: senders, error: sendersError } = await supabase
      .from('sender_identities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sendersError) {
      return NextResponse.json({ error: sendersError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, senders })
  } catch (error: any) {
    console.error('[v0] Senders fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch senders' }, { status: 500 })
  }
}

/**
 * POST /api/email/senders
 * Create a new sender identity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { domain_id, from_email, from_name } = body

    if (!domain_id || !from_email) {
      return NextResponse.json(
        { error: 'Domain ID and from_email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(from_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Verify domain belongs to user
    const { data: domain, error: domainError } = await supabase
      .from('email_domains')
      .select('*')
      .eq('id', domain_id)
      .eq('user_id', user.id)
      .single()

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    if (!domain.verified) {
      return NextResponse.json(
        { error: 'Domain must be verified before adding senders' },
        { status: 400 }
      )
    }

    const { data: sender, error: insertError } = await supabase
      .from('sender_identities')
      .insert({
        user_id: user.id,
        domain_id,
        from_email,
        from_name: from_name || '',
        verified: true, // Mark as verified if domain is verified
        is_default: false
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`[v0] Sender identity created: ${from_email} for user ${user.id}`)

    return NextResponse.json({ success: true, sender }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Sender creation error:', error.message)
    return NextResponse.json({ error: 'Failed to create sender' }, { status: 500 })
  }
}
