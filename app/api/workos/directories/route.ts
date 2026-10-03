import { NextResponse } from 'next/server'
import { listDirectories } from '@/lib/workos-client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const cursor = new URL(request.url).searchParams.get('after') ?? undefined
    return NextResponse.json(await listDirectories(cursor))
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Unable to list WorkOS directories'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
