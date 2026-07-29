import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

/**
 * GET /api/email/domains
 * List all email domains for the user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: domains, error: domainsError } = await supabase
      .from('email_domains')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (domainsError) {
      return NextResponse.json({ error: domainsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, domains })
  } catch (error: any) {
    console.error('[v0] Domain fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }
}

/**
 * POST /api/email/domains
 * Add a new email domain
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { domain_name } = body

    if (!domain_name) {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain_name)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const verificationToken = uuidv4()

    const { data: domain, error: insertError } = await supabase
      .from('email_domains')
      .insert({
        user_id: user.id,
        domain_name,
        verification_token: verificationToken,
        verified: false,
        dns_record: {
          type: 'CNAME',
          name: `bounce.${domain_name}`,
          value: `bounce.resend.com`,
          note: 'Add this DNS record to verify your domain'
        }
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`[v0] Domain added: ${domain_name} for user ${user.id}`)

    return NextResponse.json({
      success: true,
      domain,
      verification_instructions: {
        step1: 'Add the following DNS record to your domain registrar',
        dns_record: domain.dns_record,
        step2: 'Wait for DNS propagation (usually 15-30 minutes)',
        step3: 'Click "Verify Domain" to confirm ownership'
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Domain creation error:', error.message)
    return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
  }
}
