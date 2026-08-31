import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackErrorMessage, paystackRequest, toPaystackSubunit, type PaystackCurrency } from '@/lib/paystack'

type TransferBody = {
  amount?: number
  currency?: PaystackCurrency
  recipient?: string
  reason?: string
  reference?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = (await request.json()) as TransferBody
    if (!body.recipient?.trim()) return NextResponse.json({ error: 'Recipient is required' }, { status: 400 })
    const currency = body.currency ?? 'NGN'
    const amount = toPaystackSubunit(Number(body.amount), currency)
    const data = await paystackRequest('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance', amount, currency, recipient: body.recipient.trim(), reason: body.reason?.trim(),
        reference: body.reference?.trim() || `chase_${user.id}_${crypto.randomUUID()}`,
      }),
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}

export async function GET() {
  try {
    return NextResponse.json(await paystackRequest('/transfer'))
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}
