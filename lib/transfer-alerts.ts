import { z } from 'zod'

const transferAlertSchema = z.object({
  recipientPhone: z.string().trim().min(7).max(30).optional(),
  recipientEmail: z.string().trim().email().optional(),
  recipientName: z.string().trim().min(1).max(120),
  senderName: z.string().trim().min(1).max(120).default('BankChase customer'),
  amount: z.number().positive(),
  transferType: z.enum(['zelle', 'bank_transfer', 'internal']),
  status: z.enum(['initiated', 'completed', 'failed']),
  transferId: z.string().min(1),
  failureReason: z.string().max(300).optional(),
})

export type TransferAlertInput = z.input<typeof transferAlertSchema>

function messageFor(input: z.output<typeof transferAlertSchema>) {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(input.amount)
  const method = input.transferType === 'zelle' ? 'Zelle' : 'bank transfer'
  if (input.status === 'failed') return `BankChase ${method} alert: your ${amount} transfer to ${input.recipientName} failed${input.failureReason ? `: ${input.failureReason}` : '.'}`
  if (input.status === 'initiated') return `BankChase ${method} alert: a ${amount} transfer to ${input.recipientName} was initiated. ID ${input.transferId}.`
  return `BankChase credit alert: ${input.recipientName} received ${amount} via ${method}. Transfer ID ${input.transferId}.`
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_PHONE_NUMBER
  if (!sid || !token || !from) return { channel: 'sms', sent: false, reason: 'Twilio is not configured' }
  const form = new URLSearchParams({ From: from, To: to, Body: body })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  if (!response.ok) throw new Error(`Twilio request failed with status ${response.status}`)
  return { channel: 'sms', sent: true }
}

async function sendEmail(to: string, subject: string, body: string) {
  const key = process.env.SENDGRID_API_KEY
  const from = process.env.SENDGRID_FROM_EMAIL
  if (!key || !from) return { channel: 'email', sent: false, reason: 'SendGrid is not configured' }
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: from, name: 'BankChase' }, subject, content: [{ type: 'text/plain', value: body }] }),
  })
  if (!response.ok) throw new Error(`SendGrid request failed with status ${response.status}`)
  return { channel: 'email', sent: true }
}

export async function deliverTransferAlerts(input: TransferAlertInput) {
  const data = transferAlertSchema.parse(input)
  const body = messageFor(data)
  const subject = data.status === 'completed' ? 'BankChase credit alert' : `BankChase transfer ${data.status} alert`
  const results = await Promise.allSettled([
    data.recipientPhone ? sendSms(data.recipientPhone, body) : Promise.resolve({ channel: 'sms', sent: false, reason: 'No recipient phone supplied' }),
    data.recipientEmail ? sendEmail(data.recipientEmail, subject, body) : Promise.resolve({ channel: 'email', sent: false, reason: 'No recipient email supplied' }),
  ])
  return results.map((result) => result.status === 'fulfilled' ? result.value : { channel: 'unknown', sent: false, reason: result.reason instanceof Error ? result.reason.message : 'Delivery failed' })
}

export { messageFor }
