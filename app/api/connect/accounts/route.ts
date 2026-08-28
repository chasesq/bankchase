import { NextRequest, NextResponse } from 'next/server'
import { createConnectAccount, stripeErrorMessage } from '@/lib/services/connect-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createConnectAccount({
      displayName: String(body.displayName ?? ''),
      email: String(body.email ?? ''),
      country: body.country ? String(body.country) : undefined,
    })
    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: stripeErrorMessage(error) }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Connect account API is operational' })
}
