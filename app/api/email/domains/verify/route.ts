import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

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

    // Verify with Resend API (if API key is available)
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await axios.post(
          `https://api.resend.com/domains/${domain.domain_name}/verify`,
          {},
          {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        // Update domain as verified
        const { data: updatedDomain, error: updateError } = await supabase
          .from('email_domains')
          .update({
            verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', domain_id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        console.log(`[v0] Domain verified: ${domain.domain_name}`)

        return NextResponse.json({
          success: true,
          message: 'Domain verified successfully',
          domain: updatedDomain
        })
      } catch (resendError: any) {
        console.warn('[v0] Resend verification failed:', resendError.response?.data || resendError.message)
        
        // Return verification pending status
        return NextResponse.json({
          success: false,
          message: 'DNS verification pending. Please ensure DNS records are properly configured and wait 15-30 minutes for propagation.',
          error: resendError.response?.data?.message || 'DNS not yet verified'
        }, { status: 202 })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Resend API key not configured. Please contact support.'
    }, { status: 500 })
  } catch (error: any) {
    console.error('[v0] Domain verification error:', error.message)
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 })
  }
}
