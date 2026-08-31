import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackErrorMessage, paystackRequest, toPaystackSubunit, type PaystackCurrency } from '@/lib/paystack'

type InitializeBody = {
  email?: string
  amount?: number
  currency?: PaystackCurrency
  callbackUrl?: string
  reference?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as InitializeBody
    const currency = body.currency ?? 'NGN'
    if (!(currency in { NGN: 1, USD: 1, GHS: 1, ZAR: 1, KES: 1, XOF: 1 })) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })
    }
    const amount = toPaystackSubunit(Number(body.amount), currency)
    const email = body.email?.trim() || user.email
    if (!email) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })

    const data = await paystackRequest<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount,
        currency,
        reference: body.reference,
        callback_url: body.callbackUrl,
        metadata: { user_id: user.id, ...(body.metadata ?? {}) },
      }),
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}
