import { NextRequest, NextResponse } from 'next/server'
import { createOnboardingLink, stripeErrorMessage } from '@/lib/services/connect-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const accountId = String(body.accountId ?? '')
    const origin = new URL(request.url).origin
    const refreshUrl = String(body.refreshUrl ?? `${origin}/connect/onboarding?refresh=1`)
    const returnUrl = String(body.returnUrl ?? `${origin}/connect/onboarding?complete=1`)
    const link = await createOnboardingLink(accountId, refreshUrl, returnUrl)
    return NextResponse.json({ success: true, url: link.url, expiresAt: link.expires_at })
  } catch (error) {
    return NextResponse.json({ success: false, error: stripeErrorMessage(error) }, { status: 400 })
  }
}
