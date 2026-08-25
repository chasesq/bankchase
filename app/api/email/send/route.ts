import { sendOnboardingEmail, sendWorkflowCompletionEmail, sendCustomEmail } from '@/lib/email/resend-client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const emailSchema = z.string().trim().email().max(320)
const emailListSchema = z.union([emailSchema, z.array(emailSchema).max(20)]).optional()
const requestSchema = z.object({
  type: z.enum(['onboarding', 'completion', 'custom']),
  email: emailSchema.optional(),
  name: z.string().trim().min(1).max(120).optional(),
  workflowRunId: z.string().trim().min(1).max(200).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  html: z.string().max(200_000).optional(),
  text: z.string().max(100_000).optional(),
  cc: emailListSchema,
  bcc: emailListSchema,
  replyTo: emailSchema.optional(),
}).refine((value) => value.html || value.text || value.type !== 'custom', {
  message: 'Custom emails require html or text content',
  path: ['html'],
})

function getSafeError(error: unknown) {
  return error instanceof Error && error.message.startsWith('RESEND_API_KEY')
    ? 'Email delivery is not configured. Set RESEND_API_KEY to a real Resend API key.'
    : error instanceof Error ? error.message : 'Internal server error'
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid email request', 400)
    }

    const { type, email, name, workflowRunId, subject, html, text, cc, bcc, replyTo } = parsed.data
    const configuredRecipient = process.env.RESEND_TEST_TO?.trim()
    const recipient = email ?? configuredRecipient

    if (!recipient) {
      return jsonError('Provide an email recipient or configure RESEND_TEST_TO.', 400)
    }

    let result

    if (type === 'onboarding') {
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Name is required for onboarding emails' },
          { status: 400 }
        )
      }
      result = await sendOnboardingEmail({ email: recipient, name })
    } else if (type === 'completion') {
      if (!name || !workflowRunId) {
        return NextResponse.json(
          { success: false, error: 'Name and workflowRunId are required for completion emails' },
          { status: 400 }
        )
      }
      result = await sendWorkflowCompletionEmail({
        email: recipient,
        name,
        workflowRunId,
      })
    } else if (type === 'custom') {
      if (!subject) {
        return NextResponse.json(
          { success: false, error: 'Subject is required for custom emails' },
          { status: 400 }
        )
      }
      
      result = await sendCustomEmail({
        to: recipient,
        subject,
        html,
        text,
        cc,
        bcc,
        replyTo,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid email type. Supported types: onboarding, completion, custom' },
        { status: 400 }
      )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Email API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
