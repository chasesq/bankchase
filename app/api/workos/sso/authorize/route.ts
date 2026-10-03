import { NextResponse } from 'next/server'
import { workosAuthorizeUrl } from '@/lib/workos-client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const redirectUri = url.searchParams.get('redirect_uri')
    if (!redirectUri) return NextResponse.json({ error: 'redirect_uri is required' }, { status: 400 })

    const authorizeUrl = workosAuthorizeUrl({
      redirectUri,
      provider: url.searchParams.get('provider') ?? undefined,
      organization: url.searchParams.get('organization') ?? undefined,
    })
    return NextResponse.json({ url: authorizeUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create SSO URL'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
