import { NextRequest, NextResponse } from 'next/server'
import { getProduct } from '@/lib/products'
import { getStripe, integrationIdentifier, stripeErrorMessage } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = getProduct(body.productId)
    const quantity = Number(body.quantity ?? 1)
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ error: 'Quantity must be an integer between 1 and 20.' }, { status: 400 })

    const origin = new URL(request.url).origin
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: product.currency, product_data: { name: product.name, description: product.description }, unit_amount: product.priceInCents }, quantity }],
      success_url: `${origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payments/cancelled`,
      integration_identifier: integrationIdentifier('bankchase_checkout'),
      metadata: { productId: product.id },
    } as any)
    return NextResponse.json({ success: true, sessionId: session.id, url: session.url })
  } catch (error) {
    return NextResponse.json({ success: false, error: stripeErrorMessage(error) }, { status: 400 })
  }
}
