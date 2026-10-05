import { NextRequest, NextResponse } from "next/server"
import { sendSmsAlert } from "@/lib/sms-alerts"
import { sendCustomEmail } from "@/lib/email/resend-client"

export const runtime = "nodejs"

type AlertStatus = "initiated" | "completed" | "failed"

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: unknown): value is string {
  return typeof value === "string" && /^\+?[1-9]\d{7,14}$/.test(value.replace(/[\s().-]/g, ""))
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}

function buildMessage({ amount, currency, status, recipientName, reference }: {
  amount: number
  currency: string
  status: AlertStatus
  recipientName: string
  reference: string
}) {
  const amountText = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
  if (status === "failed") return `Your ${currency} ${amountText} transfer to ${recipientName} could not be completed. Ref: ${reference}.`
  if (status === "initiated") return `Your ${amountText} transfer to ${recipientName} has been initiated. Ref: ${reference}.`
  return `Your ${amountText} transfer to ${recipientName} was completed. Ref: ${reference}.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, email, amount, currency = "USD", status = "completed", recipientName = "recipient", reference = `TX-${Date.now()}` } = body
    const parsedAmount = Number(amount)
    const normalizedPhone = typeof phoneNumber === "string" ? phoneNumber.replace(/[\s().-]/g, "") : ""

    if (!isValidEmail(email) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: "Provide a valid recipient email and a positive amount." }, { status: 400 })
    }
    if (!["initiated", "completed", "failed"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid alert status." }, { status: 400 })
    }

    const safeRecipientName = String(recipientName).trim().slice(0, 120) || 'recipient'
    const safeReference = String(reference).trim().slice(0, 64) || `TX-${Date.now()}`
    const message = buildMessage({ amount: parsedAmount, currency, status, recipientName: safeRecipientName, reference: safeReference })
    const htmlMessage = `<p>${escapeHtml(message)}</p>`
    const idempotencyKey = `transaction-alert/${safeReference}/${status}`.slice(0, 256)
    const results = await Promise.all([
      isValidPhone(normalizedPhone)
        ? sendSmsAlert({ phoneNumber: normalizedPhone, amount: parsedAmount, currency, status, transactionId: safeReference, receiverAccount: safeRecipientName })
        : Promise.resolve({ success: false, error: "No phone provided" }),
      sendCustomEmail({ to: email, subject: `BankChase transfer ${status}`, text: message, html: htmlMessage, idempotencyKey }),
    ])

    const sms = results[0]
    const emailResult = results[1]
    const delivered = [sms, emailResult].filter((result) => result.success).length
    return NextResponse.json({ success: delivered > 0, delivered, channels: { sms: sms.success, email: emailResult.success }, errors: [sms, emailResult].filter((result) => !result.success).map((result) => result.error).filter(Boolean) })
  } catch (error) {
    console.error("[v0] transaction alert error", error)
    return NextResponse.json({ success: false, error: "Unable to send transaction alerts." }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ endpoint: "/api/notifications/transaction", channels: ["sms", "email"] })
}
