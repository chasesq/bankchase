import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAlgoliaAdminClient, transactionsIndexName } from '@/lib/algolia'

const transactionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  account_id: z.union([z.string(), z.number()]).optional(),
  type: z.enum(['debit', 'credit']),
  amount: z.number().finite(),
  description: z.string().trim().min(1),
  category: z.string().trim().optional(),
  to_account: z.string().optional(),
  status: z.string().optional(),
  date: z.string(),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = z.object({ transactions: z.array(transactionSchema).min(1) }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid transaction payload' }, { status: 400 })
    }

    const objects = parsed.data.transactions.map((transaction) => ({
      ...transaction,
      objectID: String(transaction.id),
      searchableText: [transaction.description, transaction.category].filter(Boolean).join(' '),
    }))

    const client = getAlgoliaAdminClient()
    await client.saveObjects({ indexName: transactionsIndexName, objects })

    return NextResponse.json({ indexName: transactionsIndexName, indexed: objects.length })
  } catch (error) {
    console.error('[v0] Algolia transaction indexing failed:', error)
    return NextResponse.json({ error: 'Failed to index transactions' }, { status: 500 })
  }
}
