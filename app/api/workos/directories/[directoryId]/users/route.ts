import { NextResponse } from 'next/server'
import { listDirectoryUsers } from '@/lib/workos-client'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ directoryId: string }> }) {
  const { directoryId } = await params
  if (!directoryId) return NextResponse.json({ error: 'directoryId is required' }, { status: 400 })
  try {
    const cursor = new URL(request.url).searchParams.get('after') ?? undefined
    return NextResponse.json(await listDirectoryUsers(directoryId, cursor))
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Unable to list directory users'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
