import { Index } from '@upstash/vector'

let index: Index | undefined

export function getVectorIndex() {
  if (index) return index

  const url = process.env.UPSTASH_VECTOR_REST_URL
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN

  if (!url || !token) {
    throw new Error('Upstash Vector is not configured')
  }

  index = new Index({ url, token })
  return index
}
