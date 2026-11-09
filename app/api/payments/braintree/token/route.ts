import { NextResponse } from 'next/server'
import { getBraintreeGateway } from '@/lib/braintree'

export async function GET() {
  try {
    const gateway = getBraintreeGateway()
    const response = await gateway.clientToken.generate({})
    return NextResponse.json({ clientToken: response.clientToken })
  } catch (error) {
    console.error('[v0] Braintree client token failed:', error)
    return NextResponse.json({ error: 'Braintree sandbox is not configured.' }, { status: 503 })
  }
}
