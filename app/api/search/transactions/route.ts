import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getVectorIndex } from '@/lib/upstash-vector'

const querySchema = z.object({
  query: z.string().trim().min(1).max(500),
  topK: z.number().int().min(1).max(50).optional().default(10),
  includeVectors: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = querySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid search query is required' }, { status: 400 })
    }

    const { query, topK, includeVectors } = parsed.data
    const results = await getVectorIndex().query({
      data: query,
      topK,
      includeVectors,
      includeMetadata: true,
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[v0] Vector search failed:', error)
    return NextResponse.json(
      { error: 'Vector search is unavailable. Check the Upstash Vector configuration.' },
      { status: 503 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ service: 'upstash-vector', status: 'ready' })
}
