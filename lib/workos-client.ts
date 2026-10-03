const WORKOS_API_URL = 'https://api.workos.com'

function workosApiKey() {
  return process.env.WORKOS_API_KEY ?? process.env.WORKOS_SECRET_KEY ?? process.env.API_key
}

function workosClientId() {
  return process.env.WORKOS_CLIENT_ID
}

export function getWorkOSConfig() {
  const apiKey = workosApiKey()
  const clientId = workosClientId()
  if (!apiKey) throw new Error('WORKOS_API_KEY is not configured')
  return { apiKey, clientId }
}

export function workosAuthorizeUrl(params: {
  redirectUri: string
  provider?: string
  organization?: string
}) {
  const { clientId } = getWorkOSConfig()
  if (!clientId) throw new Error('WORKOS_CLIENT_ID is not configured')
  const url = new URL('/sso/authorize', WORKOS_API_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  if (params.provider) url.searchParams.set('provider', params.provider)
  if (params.organization) url.searchParams.set('organization', params.organization)
  return url.toString()
}

async function workosRequest<T>(path: string, init: RequestInit = {}) {
  const { apiKey } = getWorkOSConfig()
  const response = await fetch(`${WORKOS_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body ? String(body.message) : 'WorkOS request failed'
    throw new Error(`${response.status}: ${message}`)
  }
  return body as T
}

export type WorkOSProfile = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  idpId?: string
  organizationId?: string
  connectionId?: string
}

export function exchangeSSOCode(code: string) {
  const { clientId } = getWorkOSConfig()
  if (!clientId) throw new Error('WORKOS_CLIENT_ID is not configured')
  return workosRequest<{ profile: WorkOSProfile; access_token?: string }>('/sso/profile_and_token', {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, code }),
  })
}

export type WorkOSDirectory = {
  id: string
  name: string
  state: string
  type: string
  idpId?: string
}

export type WorkOSDirectoryUser = {
  id: string
  directoryId: string
  username?: string
  emails?: Array<{ primary?: boolean; value: string }>
  firstName?: string
  lastName?: string
  state?: string
  rawAttributes?: Record<string, unknown>
}

export function listDirectories(cursor?: string) {
  const query = cursor ? `?limit=100&before=${encodeURIComponent(cursor)}` : '?limit=100'
  return workosRequest<{ data: WorkOSDirectory[]; listMetadata?: { before?: string; after?: string } }>(`/directories${query}`)
}

export function listDirectoryUsers(directoryId: string, cursor?: string) {
  const query = cursor ? `?limit=100&before=${encodeURIComponent(cursor)}` : '?limit=100'
  return workosRequest<{ data: WorkOSDirectoryUser[]; listMetadata?: { before?: string; after?: string } }>(`/directories/${encodeURIComponent(directoryId)}/users${query}`)
}
