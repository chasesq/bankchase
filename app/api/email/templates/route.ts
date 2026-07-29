import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * GET /api/email/templates
 * List all email templates for the user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (templatesError) {
      return NextResponse.json({ error: templatesError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, templates })
  } catch (error: any) {
    console.error('[v0] Templates fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

/**
 * POST /api/email/templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, html_body, text_body, variables } = body

    // Validation
    if (!name || !subject) {
      return NextResponse.json(
        { error: 'Name and subject are required' },
        { status: 400 }
      )
    }

    if (!html_body && !text_body) {
      return NextResponse.json(
        { error: 'HTML body or text body is required' },
        { status: 400 }
      )
    }

    // Extract variables from template strings (e.g., {{firstName}}, {{amount}})
    const extractVariables = (text: string) => {
      const regex = /\{\{(\w+)\}\}/g
      const vars = new Set<string>()
      let match
      while ((match = regex.exec(text)) !== null) {
        vars.add(match[1])
      }
      return Array.from(vars)
    }

    const extractedVars = [
      ...extractVariables(html_body || ''),
      ...extractVariables(text_body || '')
    ]

    const { data: template, error: insertError } = await supabase
      .from('email_templates')
      .insert({
        user_id: user.id,
        name,
        subject,
        html_body,
        text_body,
        variables: extractedVars || variables || [],
        is_default: false
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`[v0] Template created: ${name} for user ${user.id}`)

    return NextResponse.json(
      { success: true, template },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Template creation error:', error.message)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
