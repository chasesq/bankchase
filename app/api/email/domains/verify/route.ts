import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

/**
 * POST /api/email/domains/verify
 * Verify a domain with Resend
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { domain_id } = body

    if (!domain_id) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    // Fetch the domain
    const { data: domain, error: fetchError } = await supabase
      .from('email_domains')
      .select('*')
      .eq('id', domain_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    if (domain.verified) {
      return NextResponse.json({
        success: true,
        message: 'Domain is already verified',
        domain
      })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key is not configured' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const resendDomainId = domain.resend_domain_id as string | undefined
    if (!resendDomainId) {
      return NextResponse.json({ error: 'Domain is missing its Resend domain ID' }, { status: 409 })
    }

    const { data: verification, error: resendError } = await resend.domains.verify(resendDomainId)
    if (resendError) {
      return NextResponse.json({
        success: false,
        message: 'DNS verification is still pending. Add the exact records returned by Resend and try again.',
        error: resendError.message,
      }, { status: 202 })
    }

    const { data: updatedDomain, error: updateError } = await supabase
      .from('email_domains')
      .update({
        verified: true,
        dns_record: domain.dns_record,
        updated_at: new Date().toISOString()
      })
      .eq('id', domain_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Domain verified successfully', domain: updatedDomain })
  } catch (error: any) {
    console.error('[v0] Domain verification error:', error.message)
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 })
  }
}
