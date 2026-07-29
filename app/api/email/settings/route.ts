import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/email/settings
 * Get user's email settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code === 'PGRST116') {
      // Settings don't exist, create default ones
      const { data: newSettings, error: createError } = await supabase
        .from('email_settings')
        .insert({
          user_id: user.id,
          enable_delivery_tracking: true,
          enable_open_tracking: true,
          enable_click_tracking: true,
          unsubscribe_header: true
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      settings = newSettings
    } else if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('[v0] Settings fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

/**
 * PUT /api/email/settings
 * Update user's email settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      default_domain_id,
      default_template_id,
      default_sender_id,
      enable_delivery_tracking,
      enable_open_tracking,
      enable_click_tracking,
      unsubscribe_header
    } = body

    // Verify IDs belong to user if provided
    if (default_domain_id) {
      const { data: domain } = await supabase
        .from('email_domains')
        .select('id')
        .eq('id', default_domain_id)
        .eq('user_id', user.id)
        .single()

      if (!domain) {
        return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
      }
    }

    if (default_template_id) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('id')
        .eq('id', default_template_id)
        .eq('user_id', user.id)
        .single()

      if (!template) {
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
      }
    }

    if (default_sender_id) {
      const { data: sender } = await supabase
        .from('sender_identities')
        .select('id')
        .eq('id', default_sender_id)
        .eq('user_id', user.id)
        .single()

      if (!sender) {
        return NextResponse.json({ error: 'Invalid sender' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (default_domain_id !== undefined) updateData.default_domain_id = default_domain_id
    if (default_template_id !== undefined) updateData.default_template_id = default_template_id
    if (default_sender_id !== undefined) updateData.default_sender_id = default_sender_id
    if (enable_delivery_tracking !== undefined) updateData.enable_delivery_tracking = enable_delivery_tracking
    if (enable_open_tracking !== undefined) updateData.enable_open_tracking = enable_open_tracking
    if (enable_click_tracking !== undefined) updateData.enable_click_tracking = enable_click_tracking
    if (unsubscribe_header !== undefined) updateData.unsubscribe_header = unsubscribe_header
    updateData.updated_at = new Date().toISOString()

    const { data: settings, error: updateError } = await supabase
      .from('email_settings')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`[v0] Email settings updated for user ${user.id}`)

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('[v0] Settings update error:', error.message)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
