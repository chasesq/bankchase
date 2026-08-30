import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendCustomEmail } from '@/lib/email/resend-client'

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email(), stage: z.string(), priority: z.string(), demoUrl: z.string().url() })

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Please provide a valid name and work email.' }, { status: 400 })
  const { name, email, demoUrl } = parsed.data
  let emailSent = false
  if (process.env.RESEND_API_KEY) {
    try {
      await sendCustomEmail({ to: email, subject: 'Your customized Mercury demo', html: `<p>Hi ${name},</p><p>Your customized demo is ready.</p><p><a href="${demoUrl}">Open your demo</a></p>` })
      emailSent = true
    } catch (error) {
      console.warn('[v0] Demo email delivery unavailable:', error)
    }
  }
  return NextResponse.json({ success: true, emailSent, demoUrl })
}
