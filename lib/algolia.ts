import { algoliasearch } from 'algoliasearch'

const appId = process.env.Application_ID
const writeApiKey = process.env.Write_API_Key

export const transactionsIndexName = process.env.ALGOLIA_TRANSACTIONS_INDEX ?? 'transactions_index'

export function getAlgoliaAdminClient() {
  if (!appId || !writeApiKey) {
    throw new Error('Algolia server credentials are not configured')
  }

  return algoliasearch(appId, writeApiKey)
}
