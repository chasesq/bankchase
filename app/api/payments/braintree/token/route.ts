import { NextResponse } from 'next/server'
import { getBraintreeGateway } from '@/lib/braintree'

export async function GET() {
  try {
    const gateway = getBraintreeGateway()
    const response = await gateway.clientToken.generate({})
    return NextResponse.json({ clientToken: response.clientToken })
  } catch (error) {
    console.error('[v0] Braintree token failed:', error)
    const rawMessage = error instanceof Error ? error.message : ''
    const message = /authentication error/i.test(rawMessage)
      ? 'Braintree sandbox credentials were rejected. Use the merchant ID, public key, and private key from the same sandbox merchant.'
      : rawMessage || 'Unable to initialize Braintree.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
