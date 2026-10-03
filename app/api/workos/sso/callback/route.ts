import { NextResponse } from 'next/server'
import { exchangeSSOCode } from '@/lib/workos-client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (error) return NextResponse.json({ error, error_description: url.searchParams.get('error_description') }, { status: 400 })
  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

  try {
    return NextResponse.json(await exchangeSSOCode(code))
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Unable to exchange SSO code'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body.code !== 'string' || !body.code) return NextResponse.json({ error: 'code is required' }, { status: 400 })
    return NextResponse.json(await exchangeSSOCode(body.code))
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Unable to exchange SSO code'
    return NextResponse.json({ error: message }, { status: message === 'code is required' ? 400 : 502 })
  }
}
