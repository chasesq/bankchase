import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayPalOrder, getPayPalApprovalUrl } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const amount = Number(body.amount)
    const currency = String(body.currency || 'USD').toUpperCase()
    const description = String(body.description || 'BankChase payment').trim()
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 })
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: 'Enter a valid currency.' }, { status: 400 })
    }

    const origin = request.nextUrl.origin
    const order = await createPayPalOrder({
      amount: amount.toFixed(2),
      currency,
      description: description.slice(0, 127),
      returnUrl: `${origin}/payments?paypal=success`,
      cancelUrl: `${origin}/payments?paypal=cancelled`,
    })
    const approvalUrl = getPayPalApprovalUrl(order)
    if (!approvalUrl) throw new Error('PayPal did not return an approval URL')

    return NextResponse.json({ orderId: order.id, approvalUrl })
  } catch (error) {
    console.error('[v0] PayPal order creation failed:', error)
    return NextResponse.json({ error: 'Unable to start PayPal checkout.' }, { status: 502 })
  }
}
