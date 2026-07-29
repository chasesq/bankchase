import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/email/logs
 * Get email delivery logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: logs, count, error: logsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    // Calculate statistics
    const { data: stats } = await supabase
      .from('email_logs')
      .select('status')
      .eq('user_id', user.id)

    const statistics = {
      total: count || 0,
      sent: stats?.filter((s: any) => s.status === 'sent').length || 0,
      delivered: stats?.filter((s: any) => s.status === 'delivered').length || 0,
      opened: stats?.filter((s: any) => s.status === 'opened').length || 0,
      clicked: stats?.filter((s: any) => s.status === 'clicked').length || 0,
      bounced: stats?.filter((s: any) => s.status === 'bounced').length || 0
    }

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics
    })
  } catch (error: any) {
    console.error('[v0] Email logs fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 })
  }
}

/**
 * POST /api/email/logs
 * Create email log entry (called by notification system)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      template_id,
      recipient_email,
      recipient_name,
      subject,
      message_id,
      metadata
    } = body

    if (!recipient_email) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 })
    }

    const { data: log, error: insertError } = await supabase
      .from('email_logs')
      .insert({
        user_id: user.id,
        template_id,
        recipient_email,
        recipient_name,
        subject,
        message_id,
        metadata,
        status: 'sent'
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`[v0] Email log created for ${recipient_email}`)

    return NextResponse.json({ success: true, log }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Email log creation error:', error.message)
    return NextResponse.json({ error: 'Failed to create email log' }, { status: 500 })
  }
}
