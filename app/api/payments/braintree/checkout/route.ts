import { NextRequest, NextResponse } from 'next/server'
import { getBraintreeGateway } from '@/lib/braintree'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const amount = String(body.amount || '').trim()
    const nonce = String(body.nonce || '').trim()
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || Number(amount) > 1000000) {
      return NextResponse.json({ error: 'Enter a valid amount with up to two decimal places.' }, { status: 400 })
    }
    if (!nonce || nonce.length > 512) return NextResponse.json({ error: 'A valid payment method is required.' }, { status: 400 })

    const gateway = getBraintreeGateway()
    const result = await gateway.transaction.sale({
      amount: Number(amount).toFixed(2),
      paymentMethodNonce: nonce,
      options: { submitForSettlement: true },
    })
    if (!result.success) return NextResponse.json({ error: result.message || 'Braintree declined the payment.' }, { status: 402 })
    return NextResponse.json({ transactionId: result.transaction.id, status: result.transaction.status })
  } catch (error) {
    console.error('[v0] Braintree checkout failed:', error)
    return NextResponse.json({ error: 'Unable to complete Braintree checkout.' }, { status: 502 })
  }
}
