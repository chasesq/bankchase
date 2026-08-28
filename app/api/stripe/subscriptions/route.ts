import { NextRequest, NextResponse } from 'next/server'
import { getProduct } from '@/lib/products'
import { getStripe, integrationIdentifier, stripeErrorMessage } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = getProduct(body.productId)
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!product || !email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'A valid product and email are required.' }, { status: 400 })
    const origin = new URL(request.url).origin
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price_data: { currency: product.currency, product_data: { name: product.name, description: product.description }, unit_amount: product.priceInCents, recurring: { interval: 'month' } }, quantity: 1 }],
      success_url: `${origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payments/cancelled`,
      integration_identifier: integrationIdentifier('bankchase_subscription'),
      metadata: { productId: product.id },
    } as any)
    return NextResponse.json({ success: true, sessionId: session.id, url: session.url })
  } catch (error) {
    return NextResponse.json({ success: false, error: stripeErrorMessage(error) }, { status: 400 })
  }
}
