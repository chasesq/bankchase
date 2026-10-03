import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

type WorkOSActionResponse = {
  object: 'authentication_action_response' | 'user_registration_action_response'
  payload: {
    timestamp: number
    verdict: 'Allow' | 'Deny'
    error_message?: string
  }
  signature: string
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(received, 'hex')
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

export function verifyWorkOSSignature(body: string, header: string | null, secret: string) {
  if (!header) return false

  const timestamp = header.match(/(?:^|,)\s*t=(\d+)/)?.[1]
  const received = header.match(/(?:^|,)\s*v1=([a-f0-9]+)/i)?.[1]
  if (!timestamp || !received) return false

  const issuedAt = Number(timestamp)
  if (!Number.isSafeInteger(issuedAt) || Math.abs(Date.now() - issuedAt) > MAX_CLOCK_SKEW_MS) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return signaturesMatch(expected, received)
}

export function signWorkOSResponse(
  object: WorkOSActionResponse['object'],
  verdict: 'Allow' | 'Deny' = 'Allow',
  errorMessage?: string,
): WorkOSActionResponse {
  const timestamp = Date.now()
  const payload = {
    timestamp,
    verdict,
    ...(verdict === 'Deny' && errorMessage ? { error_message: errorMessage.slice(0, 500) } : {}),
  }
  const body = JSON.stringify(payload)
  const secret = actionsSecret()
  if (!secret) throw new Error('WorkOS actions secret is not configured')
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')

  return { object, payload, signature }
}

export function actionsSecret() {
  return process.env.WORKOS_ACTIONS_SECRET ?? process.env.Signing_secret
}

export function isAllowedActionPayload(payload: unknown) {
  return Boolean(payload && typeof payload === 'object')
}
