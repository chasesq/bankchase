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
  return { apiKey, clientId }
}

function requireApiKey() {
  const apiKey = workosApiKey()
  if (!apiKey) throw new Error('WORKOS_API_KEY is not configured')
  return apiKey
}

export function workosAuthorizeUrl(params: {
  redirectUri: string
  connection?: string
  provider?: string
  organization?: string
  state?: string
  loginHint?: string
}) {
  const { clientId } = getWorkOSConfig()
  if (!clientId) throw new Error('WORKOS_CLIENT_ID is not configured')
  const selectors = [params.connection, params.provider, params.organization].filter(Boolean)
  if (selectors.length !== 1) {
    throw new Error('Exactly one of connection, organization, or provider is required')
  }
  const url = new URL('/sso/authorize', WORKOS_API_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  if (params.connection) url.searchParams.set('connection', params.connection)
  if (params.provider) url.searchParams.set('provider', params.provider)
  if (params.organization) url.searchParams.set('organization', params.organization)
  if (params.state) url.searchParams.set('state', params.state)
  if (params.loginHint) url.searchParams.set('login_hint', params.loginHint)
  return url.toString()
}

async function workosRequest<T>(path: string, init: RequestInit = {}) {
  const apiKey = requireApiKey()
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
  role?: { slug?: string }
  customAttributes?: Record<string, unknown>
}

type WorkOSProfileResponse = {
  profile: Record<string, unknown>
  access_token?: string
  accessToken?: string
}

function normalizeProfile(profile: Record<string, unknown>): WorkOSProfile {
  return {
    id: String(profile.id ?? ''),
    email: String(profile.email ?? ''),
    firstName: typeof profile.first_name === 'string' ? profile.first_name : undefined,
    lastName: typeof profile.last_name === 'string' ? profile.last_name : undefined,
    idpId: typeof profile.idp_id === 'string' ? profile.idp_id : undefined,
    organizationId: typeof profile.organization_id === 'string' ? profile.organization_id : undefined,
    connectionId: typeof profile.connection_id === 'string' ? profile.connection_id : undefined,
    role: profile.role && typeof profile.role === 'object' ? profile.role as { slug?: string } : undefined,
    customAttributes: profile.custom_attributes && typeof profile.custom_attributes === 'object' ? profile.custom_attributes as Record<string, unknown> : undefined,
  }
}

export async function exchangeSSOCode(code: string) {
  const { clientId } = getWorkOSConfig()
  if (!clientId) throw new Error('WORKOS_CLIENT_ID is not configured')
  const response = await workosRequest<WorkOSProfileResponse>('/sso/profile_and_token', {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, code }),
  })
  return {
    profile: normalizeProfile(response.profile),
    access_token: response.access_token ?? response.accessToken,
  }
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
  role?: { slug?: string }
  customAttributes?: Record<string, unknown>
}

function normalizeDirectory(directory: Record<string, unknown>): WorkOSDirectory {
  return {
    id: String(directory.id ?? ''),
    name: String(directory.name ?? ''),
    state: String(directory.state ?? ''),
    type: String(directory.type ?? ''),
    idpId: typeof directory.idp_id === 'string' ? directory.idp_id : undefined,
  }
}

function normalizeDirectoryUser(user: Record<string, unknown>): WorkOSDirectoryUser {
  const emails = Array.isArray(user.emails) ? user.emails.filter((email): email is Record<string, unknown> => Boolean(email && typeof email === 'object')).map((email) => ({
    primary: typeof email.primary === 'boolean' ? email.primary : undefined,
    value: String(email.value ?? ''),
  })) : undefined
  return {
    id: String(user.id ?? ''),
    directoryId: String(user.directory_id ?? ''),
    username: typeof user.username === 'string' ? user.username : undefined,
    emails,
    firstName: typeof user.first_name === 'string' ? user.first_name : undefined,
    lastName: typeof user.last_name === 'string' ? user.last_name : undefined,
    state: typeof user.state === 'string' ? user.state : undefined,
    role: user.role && typeof user.role === 'object' ? user.role as { slug?: string } : undefined,
    customAttributes: user.custom_attributes && typeof user.custom_attributes === 'object' ? user.custom_attributes as Record<string, unknown> : undefined,
  }
}

function listQuery(cursor?: string) {
  return cursor ? `?limit=100&after=${encodeURIComponent(cursor)}` : '?limit=100'
}

export async function listDirectories(cursor?: string) {
  const response = await workosRequest<{ data: Record<string, unknown>[]; list_metadata?: { before?: string; after?: string }; listMetadata?: { before?: string; after?: string } }>(`/directories${listQuery(cursor)}`)
  return { data: response.data.map(normalizeDirectory), listMetadata: response.list_metadata ?? response.listMetadata }
}

export async function listDirectoryUsers(directoryId: string, cursor?: string) {
  const response = await workosRequest<{ data: Record<string, unknown>[]; list_metadata?: { before?: string; after?: string }; listMetadata?: { before?: string; after?: string } }>(`/directories/${encodeURIComponent(directoryId)}/users${listQuery(cursor)}`)
  return { data: response.data.map(normalizeDirectoryUser), listMetadata: response.list_metadata ?? response.listMetadata }
}
