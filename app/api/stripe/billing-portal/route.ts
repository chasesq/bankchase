import { NextRequest, NextResponse } from 'next/server'
import { getStripe, stripeErrorMessage } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customerId = String(body.customerId ?? '')
    if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) return NextResponse.json({ error: 'A valid Stripe customer is required.' }, { status: 400 })
    const origin = new URL(request.url).origin
    const session = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: String(body.returnUrl ?? `${origin}/accounts`) })
    return NextResponse.json({ success: true, url: session.url })
  } catch (error) {
    return NextResponse.json({ success: false, error: stripeErrorMessage(error) }, { status: 400 })
  }
}
