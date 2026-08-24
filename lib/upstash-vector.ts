import { Index } from '@upstash/vector'

let index: Index | undefined

export function getVectorIndex() {
  if (index) return index

  const rawUrl = (
    process.env.UPSTASH_VECTOR_REST_URL?.trim() ||
    'humorous-hermit-137917.upstash.io'
  )
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN?.trim()

  if (!rawUrl || !token) {
    throw new Error('Upstash Vector is not configured')
  }

  // Upstash may expose the resource as a hostname without a scheme.
  const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`

  index = new Index({ url, token })
  return index
}
