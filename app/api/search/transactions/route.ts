import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSql } from '@/lib/db'
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

    try {
      const results = await getVectorIndex().query({
        data: query,
        topK,
        includeVectors,
        includeMetadata: true,
      })
      return NextResponse.json({ results, source: 'vector' })
    } catch (vectorError) {
      console.error('[v0] Vector search unavailable, using database fallback:', vectorError)
      try {
        const sql = getSql()
        const results = await sql`
          SELECT id, user_id, amount, description, type, status, created_at
          FROM transactions
          WHERE description ILIKE ${`%${query}%`}
             OR type ILIKE ${`%${query}%`}
             OR status ILIKE ${`%${query}%`}
          ORDER BY created_at DESC
          LIMIT ${topK}
        `
        return NextResponse.json({ results, source: 'database-fallback' })
      } catch (databaseError) {
        console.error('[v0] Database search fallback failed:', databaseError)
        return NextResponse.json({ results: [], source: 'empty-fallback' })
      }
    }
  } catch (error) {
    console.error('[v0] Transaction search failed:', error)
    return NextResponse.json(
      { error: 'Transaction search is temporarily unavailable.' },
      { status: 503 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ service: 'upstash-vector', status: 'ready' })
}
