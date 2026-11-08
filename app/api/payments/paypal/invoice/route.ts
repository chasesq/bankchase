import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayPalInvoice } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await (await createClient()).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const recipientEmail = String(body.recipientEmail || '').trim().toLowerCase()
    const amountText = String(body.amount || '').trim()
    const currency = String(body.currency || 'USD').trim().toUpperCase()
    const description = String(body.description || '').trim().slice(0, 127)
    const amount = Number(amountText)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) return NextResponse.json({ error: 'Enter a valid recipient email.' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000 || !/^\d+(\.\d{1,2})?$/.test(amountText)) return NextResponse.json({ error: 'Enter a valid amount with up to two decimal places.' }, { status: 400 })
    if (!description) return NextResponse.json({ error: 'Enter an invoice description.' }, { status: 400 })
    if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: 'Enter a valid currency.' }, { status: 400 })
    const invoice = await createPayPalInvoice({ recipientEmail, amount: amount.toFixed(2), currency, description })
    return NextResponse.json({ id: invoice.id, status: invoice.status })
  } catch (error) {
    console.error('[v0] PayPal invoice failed:', error)
    return NextResponse.json({ error: 'Unable to create PayPal invoice.' }, { status: 502 })
  }
}
