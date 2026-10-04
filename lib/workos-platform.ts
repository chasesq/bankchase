const WORKOS_PLATFORM_URL = 'https://api.workos.com/platform'
const WORKOS_TOKEN_URL = 'https://signin.workos.com/oauth2/token'

type PlatformToken = { value: string; expiresAt: number }
let cachedToken: PlatformToken | undefined

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

async function getPlatformToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value

  const body = new URLSearchParams({
    client_id: requiredEnv('WORKOS_PLATFORM_CLIENT_ID'),
    client_secret: requiredEnv('WORKOS_PLATFORM_CLIENT_SECRET'),
    grant_type: 'client_credentials',
  })
  const response = await fetch(WORKOS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.access_token) {
    throw new Error(`WorkOS platform token request failed (${response.status})`)
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
  }
  return cachedToken.value
}

async function platformRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getPlatformToken()
  const response = await fetch(`${WORKOS_PLATFORM_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : 'WorkOS platform request failed'
    const error = new Error(`${response.status}: ${detail}`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }
  return payload as T
}

export type WorkOSTeam = { id: string; name: string; production_state?: string }
export type WorkOSEnvironment = { id: string; name: string; client_id: string }
export type WorkOSApiKey = { id: string; value: string }

export function getTeam(teamId: string) {
  return platformRequest<WorkOSTeam>(`/teams/${encodeURIComponent(teamId)}`)
}

export function createTeam(input: { adminEmail: string; name: string }) {
  return platformRequest<WorkOSTeam>('/teams', {
    method: 'POST',
    body: JSON.stringify({ admin_email: input.adminEmail, name: input.name }),
  })
}

export function createEnvironment(teamId: string, input: { name: string; production?: boolean }) {
  return platformRequest<WorkOSEnvironment>(`/teams/${encodeURIComponent(teamId)}/environments`, {
    method: 'POST',
    body: JSON.stringify({ name: input.name, production: input.production ?? false }),
  })
}

export function createEnvironmentApiKey(teamId: string, environmentId: string, name = 'Platform provisioning key') {
  return platformRequest<WorkOSApiKey>(`/teams/${encodeURIComponent(teamId)}/environments/${encodeURIComponent(environmentId)}/api_keys`, {
    method: 'POST',
    body: JSON.stringify({ name, expires_at: null }),
  })
}

export async function registerRedirectUri(apiKey: string, uri: string) {
  const response = await fetch('https://api.workos.com/user_management/redirect_uris', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uri }),
    cache: 'no-store',
  })
  if (response.ok || response.status === 422) return
  const payload = await response.json().catch(() => null)
  throw new Error(`${response.status}: ${payload?.message ?? 'Unable to register redirect URI'}`)
}

export function inviteTeamMember(teamId: string, input: { email: string; roleSlug?: string }) {
  return platformRequest(`/teams/${encodeURIComponent(teamId)}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email: input.email, role_slug: input.roleSlug ?? 'member' }),
  })
}
