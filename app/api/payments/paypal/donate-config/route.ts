import { NextResponse } from 'next/server'

export async function GET() {
  const hostedButtonId = process.env.PAYPAL_DONATE_HOSTED_BUTTON_ID?.trim()
  const business = process.env.PAYPAL_DONATE_BUSINESS?.trim()
  const environment = process.env.PAYPAL_ENVIRONMENT === 'production' ? 'production' : 'sandbox'

  if (!hostedButtonId && !business) {
    return NextResponse.json(
      { error: 'PayPal donations are not configured. Add PAYPAL_DONATE_HOSTED_BUTTON_ID or PAYPAL_DONATE_BUSINESS.' },
      { status: 503 },
    )
  }

  return NextResponse.json({
    env: environment,
    ...(hostedButtonId ? { hostedButtonId } : { business }),
  })
}
