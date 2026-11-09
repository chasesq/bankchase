import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID_2 || process.env.PayPay_Client_ID
  if (!clientId) {
    return NextResponse.json({ error: 'PayPal is not configured.' }, { status: 503 })
  }

  const environment = process.env.PAYPAL_ENVIRONMENT === 'production' ? 'production' : 'sandbox'

  return NextResponse.json({ clientId, environment }, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
