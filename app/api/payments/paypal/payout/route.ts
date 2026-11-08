import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayPalPayout } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await (await createClient()).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const recipientEmail = String(body.recipientEmail || '').trim().toLowerCase()
    const amountText = String(body.amount || '').trim()
    const currency = String(body.currency || 'USD').trim().toUpperCase()
    const note = String(body.note || 'You have a payout from BankChase').trim().slice(0, 1000)
    const amount = Number(amountText)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) return NextResponse.json({ error: 'Enter a valid recipient email.' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000 || !/^\d+(\.\d{1,2})?$/.test(amountText)) return NextResponse.json({ error: 'Enter a valid amount with up to two decimal places.' }, { status: 400 })
    if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: 'Enter a valid currency.' }, { status: 400 })
    const payout = await createPayPalPayout({ recipientEmail, amount: amount.toFixed(2), currency, note })
    return NextResponse.json({ payoutBatchId: payout.batch_header.payout_batch_id, status: payout.batch_header.batch_status })
  } catch (error) {
    console.error('[v0] PayPal payout failed:', error)
    return NextResponse.json({ error: 'Unable to send PayPal payout.' }, { status: 502 })
  }
}
