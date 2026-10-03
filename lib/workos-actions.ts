import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_CLOCK_SKEW_SECONDS = 5 * 60
const SIGNATURE_SEPARATOR = '.'

function parseSignatureHeader(header: string) {
  const timestamp = header.match(/(?:^|,)\s*t=(\d+)(?:,|$)/)?.[1]
  const signatures = [...header.matchAll(/(?:^|,)\s*v1=([a-f0-9]+)(?:,|$)/gi)].map((match) => match[1])
  return { timestamp, signatures }
}

function safeEqualHex(expected: string, received: string) {
  try {
    const expectedBuffer = Buffer.from(expected, 'hex')
    const receivedBuffer = Buffer.from(received, 'hex')
    return expectedBuffer.length > 0 && expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch {
    return false
  }
}

type WorkOSActionResponse = {
  object: 'authentication_action_response' | 'user_registration_action_response'
  payload: {
    timestamp: number
    verdict: 'Allow' | 'Deny'
    error_message?: string
  }
  signature: string
}

export function verifyWorkOSSignature(body: string, header: string | null, secret: string) {
  if (!header || !secret) return false

  const { timestamp, signatures } = parseSignatureHeader(header)
  if (!timestamp || signatures.length === 0) return false

  const issuedAt = Number(timestamp)
  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (!Number.isSafeInteger(issuedAt) || Math.abs(nowInSeconds - issuedAt) > MAX_CLOCK_SKEW_SECONDS) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}${SIGNATURE_SEPARATOR}${body}`).digest('hex')
  return signatures.some((signature) => safeEqualHex(expected, signature))
}

export function signWorkOSResponse(
  object: WorkOSActionResponse['object'],
  verdict: 'Allow' | 'Deny' = 'Allow',
  errorMessage?: string,
): WorkOSActionResponse {
  const timestamp = Math.floor(Date.now() / 1000)
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
  return (
    process.env.WORKOS_ACTIONS_SECRET ??
    process.env.WORKOS_SIGNING_SECRET ??
    process.env.Signing_secret
  )
}

export function isAllowedActionPayload(payload: unknown): payload is Record<string, unknown> {
  return Boolean(payload && typeof payload === 'object' && !Array.isArray(payload))
}
