import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
import { actionsSecret, isAllowedActionPayload, signWorkOSResponse, verifyWorkOSSignature } from '@/lib/workos-actions'

export async function POST(request: Request) {
  const secret = actionsSecret()
  const body = await request.text()

  if (!secret) return NextResponse.json({ error: 'WorkOS actions secret is not configured' }, { status: 500 })
  if (!verifyWorkOSSignature(body, request.headers.get('workos-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid WorkOS signature' }, { status: 401 })
  }

  try {
    const payload: unknown = JSON.parse(body)
    if (!isAllowedActionPayload(payload)) {
      return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    }

    return NextResponse.json(signWorkOSResponse('authentication_action_response'))
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
}
