import { algoliasearch } from 'algoliasearch'

const appId = process.env.ALGOLIA_APP_ID
const writeApiKey = process.env.ALGOLIA_WRITE_API_KEY

export const transactionsIndexName = process.env.ALGOLIA_TRANSACTIONS_INDEX ?? 'transactions_index'

export function getAlgoliaAdminClient() {
  if (!appId || !writeApiKey) {
    throw new Error('Algolia server credentials are not configured')
  }

  return algoliasearch(appId, writeApiKey)
}
