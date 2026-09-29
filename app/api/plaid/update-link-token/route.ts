import { NextResponse } from 'next/server'
import { PlaidService } from '@/lib/plaid-service'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken : ''
    const clientUserId = typeof body.clientUserId === 'string' ? body.clientUserId : undefined
    const accountSelectionEnabled = body.accountSelectionEnabled === true

    if (!accessToken) {
      return NextResponse.json({ error: 'accessToken is required.' }, { status: 400 })
    }

    const result = await PlaidService.createUpdateLinkToken({
      accessToken,
      clientUserId,
      accountSelectionEnabled,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create update link token.' },
      { status: 502 },
    )
  }
}
