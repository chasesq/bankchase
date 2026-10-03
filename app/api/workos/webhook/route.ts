import { NextResponse } from 'next/server'
import { actionsSecret, verifyWorkOSSignature } from '@/lib/workos-actions'

export const runtime = 'nodejs'

function webhookSecret() {
  return process.env.WORKOS_WEBHOOK_SECRET ?? actionsSecret()
}

export async function POST(request: Request) {
  const body = await request.text()
  const secret = webhookSecret()

  if (!secret) {
    return NextResponse.json({ error: 'WorkOS webhook secret is not configured' }, { status: 500 })
  }

  if (!verifyWorkOSSignature(body, request.headers.get('workos-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid WorkOS signature' }, { status: 401 })
  }

  try {
    JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Acknowledge immediately. Event-specific processing can be added after persistence or queuing.
  return new NextResponse(null, { status: 200 })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
}
